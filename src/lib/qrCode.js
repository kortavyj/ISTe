const VERSION = 5;
const SIZE = 17 + 4 * VERSION;
const DATA_CODEWORDS = 108;
const EC_CODEWORDS = 26;

const GF_EXP =
  new Array(512).fill(0);
const GF_LOG =
  new Array(256).fill(0);

let gfValue = 1;

for (
  let index = 0;
  index < 255;
  index += 1
) {
  GF_EXP[index] =
    gfValue;
  GF_LOG[gfValue] =
    index;

  gfValue <<= 1;

  if (
    gfValue & 0x100
  ) {
    gfValue ^=
      0x11d;
  }
}

for (
  let index = 255;
  index < 512;
  index += 1
) {
  GF_EXP[index] =
    GF_EXP[index - 255];
}

function gfMultiply(
  left,
  right,
) {
  if (
    left === 0 ||
    right === 0
  ) {
    return 0;
  }

  return GF_EXP[
    GF_LOG[left] +
      GF_LOG[right]
  ];
}

function generatorPolynomial(
  degree,
) {
  let polynomial = [1];

  for (
    let index = 0;
    index < degree;
    index += 1
  ) {
    const next =
      new Array(
        polynomial.length + 1,
      ).fill(0);

    polynomial.forEach(
      (
        coefficient,
        position,
      ) => {
        next[position] ^=
          coefficient;

        next[
          position + 1
        ] ^=
          gfMultiply(
            coefficient,
            GF_EXP[index],
          );
      },
    );

    polynomial = next;
  }

  return polynomial;
}

function reedSolomon(
  data,
  degree,
) {
  const generator =
    generatorPolynomial(
      degree,
    );

  const working = [
    ...data,
    ...new Array(
      degree,
    ).fill(0),
  ];

  for (
    let index = 0;
    index < data.length;
    index += 1
  ) {
    const factor =
      working[index];

    if (!factor) {
      continue;
    }

    generator.forEach(
      (
        coefficient,
        position,
      ) => {
        working[
          index + position
        ] ^=
          gfMultiply(
            coefficient,
            factor,
          );
      },
    );
  }

  return working.slice(
    data.length,
  );
}

function pushBits(
  target,
  value,
  length,
) {
  for (
    let index =
      length - 1;
    index >= 0;
    index -= 1
  ) {
    target.push(
      (value >>> index) & 1,
    );
  }
}

function encodeData(
  value,
) {
  const bytes = [
    ...new TextEncoder()
      .encode(value),
  ];

  if (
    bytes.length > 106
  ) {
    throw new Error(
      "QR_VALUE_TOO_LONG",
    );
  }

  const bits = [];

  pushBits(
    bits,
    0b0100,
    4,
  );

  pushBits(
    bits,
    bytes.length,
    8,
  );

  bytes.forEach(
    (byte) =>
      pushBits(
        bits,
        byte,
        8,
      ),
  );

  const capacity =
    DATA_CODEWORDS * 8;

  const terminator =
    Math.min(
      4,
      capacity -
        bits.length,
    );

  for (
    let index = 0;
    index < terminator;
    index += 1
  ) {
    bits.push(0);
  }

  while (
    bits.length % 8
  ) {
    bits.push(0);
  }

  const codewords = [];

  for (
    let index = 0;
    index < bits.length;
    index += 8
  ) {
    let codeword = 0;

    for (
      let offset = 0;
      offset < 8;
      offset += 1
    ) {
      codeword =
        (codeword << 1) |
        bits[
          index + offset
        ];
    }

    codewords.push(
      codeword,
    );
  }

  let useFirstPad = true;

  while (
    codewords.length <
    DATA_CODEWORDS
  ) {
    codewords.push(
      useFirstPad
        ? 0xec
        : 0x11,
    );

    useFirstPad =
      !useFirstPad;
  }

  return [
    ...codewords,
    ...reedSolomon(
      codewords,
      EC_CODEWORDS,
    ),
  ];
}

export function makeQrMatrix(
  value,
) {
  const matrix =
    Array.from(
      {
        length: SIZE,
      },
      () =>
        Array(SIZE)
          .fill(false),
    );

  const reserved =
    Array.from(
      {
        length: SIZE,
      },
      () =>
        Array(SIZE)
          .fill(false),
    );

  function setFunction(
    x,
    y,
    dark,
  ) {
    if (
      x < 0 ||
      y < 0 ||
      x >= SIZE ||
      y >= SIZE
    ) {
      return;
    }

    matrix[y][x] =
      Boolean(dark);

    reserved[y][x] =
      true;
  }

  function drawFinder(
    left,
    top,
  ) {
    for (
      let dy = -1;
      dy <= 7;
      dy += 1
    ) {
      for (
        let dx = -1;
        dx <= 7;
        dx += 1
      ) {
        const x =
          left + dx;
        const y =
          top + dy;

        if (
          x < 0 ||
          y < 0 ||
          x >= SIZE ||
          y >= SIZE
        ) {
          continue;
        }

        const distance =
          Math.max(
            Math.abs(
              dx - 3,
            ),
            Math.abs(
              dy - 3,
            ),
          );

        setFunction(
          x,
          y,
          distance !== 2 &&
            distance !== 4,
        );
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(
    SIZE - 7,
    0,
  );
  drawFinder(
    0,
    SIZE - 7,
  );

  for (
    let index = 8;
    index <
    SIZE - 8;
    index += 1
  ) {
    if (
      !reserved[6][index]
    ) {
      setFunction(
        index,
        6,
        index % 2 === 0,
      );
    }

    if (
      !reserved[index][6]
    ) {
      setFunction(
        6,
        index,
        index % 2 === 0,
      );
    }
  }

  const centers = [
    6,
    30,
  ];

  centers.forEach(
    (centerY) => {
      centers.forEach(
        (centerX) => {
          if (
            reserved[
              centerY
            ][centerX]
          ) {
            return;
          }

          for (
            let dy = -2;
            dy <= 2;
            dy += 1
          ) {
            for (
              let dx = -2;
              dx <= 2;
              dx += 1
            ) {
              setFunction(
                centerX + dx,
                centerY + dy,
                Math.max(
                  Math.abs(dx),
                  Math.abs(dy),
                ) !== 1,
              );
            }
          }
        },
      );
    },
  );

  for (
    let index = 0;
    index <= 5;
    index += 1
  ) {
    setFunction(
      8,
      index,
      false,
    );
  }

  setFunction(
    8,
    7,
    false,
  );

  setFunction(
    8,
    8,
    false,
  );

  setFunction(
    7,
    8,
    false,
  );

  for (
    let index = 9;
    index < 15;
    index += 1
  ) {
    setFunction(
      14 - index,
      8,
      false,
    );
  }

  for (
    let index = 0;
    index < 8;
    index += 1
  ) {
    setFunction(
      SIZE -
        1 -
        index,
      8,
      false,
    );
  }

  for (
    let index = 8;
    index < 15;
    index += 1
  ) {
    setFunction(
      8,
      SIZE -
        15 +
        index,
      false,
    );
  }

  setFunction(
    8,
    SIZE - 8,
    true,
  );

  const codewords =
    encodeData(value);

  let bitIndex = 0;

  for (
    let right =
      SIZE - 1;
    right >= 1;
    right -= 2
  ) {
    if (
      right === 6
    ) {
      right = 5;
    }

    for (
      let vertical = 0;
      vertical < SIZE;
      vertical += 1
    ) {
      const upward =
        ((right + 1) & 2) ===
        0;

      const y =
        upward
          ? SIZE -
            1 -
            vertical
          : vertical;

      for (
        let offset = 0;
        offset < 2;
        offset += 1
      ) {
        const x =
          right -
          offset;

        if (
          reserved[y][x]
        ) {
          continue;
        }

        const current =
          bitIndex;

        bitIndex += 1;

        const dark =
          current <
          codewords.length *
            8
            ? (
                codewords[
                  current >> 3
                ] >>>
                (
                  7 -
                  (current & 7)
                )
              ) &
              1
            : 0;

        matrix[y][x] =
          Boolean(dark);
      }
    }
  }

  for (
    let y = 0;
    y < SIZE;
    y += 1
  ) {
    for (
      let x = 0;
      x < SIZE;
      x += 1
    ) {
      if (
        !reserved[y][x] &&
        (x + y) % 2 === 0
      ) {
        matrix[y][x] =
          !matrix[y][x];
      }
    }
  }

  const formatData =
    1 << 3;

  let remainder =
    formatData << 10;

  for (
    let index = 14;
    index >= 10;
    index -= 1
  ) {
    if (
      (
        remainder >>>
        index
      ) &
      1
    ) {
      remainder ^=
        0x537 <<
        (index - 10);
    }
  }

  const formatBits =
    (
      (formatData << 10) |
      remainder
    ) ^
    0x5412;

  const readFormatBit =
    (index) =>
      Boolean(
        (
          formatBits >>>
          index
        ) &
          1,
      );

  for (
    let index = 0;
    index <= 5;
    index += 1
  ) {
    setFunction(
      8,
      index,
      readFormatBit(
        index,
      ),
    );
  }

  setFunction(
    8,
    7,
    readFormatBit(6),
  );

  setFunction(
    8,
    8,
    readFormatBit(7),
  );

  setFunction(
    7,
    8,
    readFormatBit(8),
  );

  for (
    let index = 9;
    index < 15;
    index += 1
  ) {
    setFunction(
      14 - index,
      8,
      readFormatBit(
        index,
      ),
    );
  }

  for (
    let index = 0;
    index < 8;
    index += 1
  ) {
    setFunction(
      SIZE -
        1 -
        index,
      8,
      readFormatBit(
        index,
      ),
    );
  }

  for (
    let index = 8;
    index < 15;
    index += 1
  ) {
    setFunction(
      8,
      SIZE -
        15 +
        index,
      readFormatBit(
        index,
      ),
    );
  }

  setFunction(
    8,
    SIZE - 8,
    true,
  );

  return matrix;
}
