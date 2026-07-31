# FACEIT roster synchronization

The roster section now reads players from `public/data/faceit-stats.json`.

The GitHub Actions updater retrieves each current team member from FACEIT, including nickname, avatar, country, FACEIT level, Elo and profile URL. It then estimates one visible CS2 role for each player from the available FACEIT statistics. The team captain is treated as the most likely IGL. AWP, ENTRY, SUPPORT and RIFLER are assigned through a weighted statistical model.

FACEIT does not publish an official CS2 tactical role for ordinary team members. The displayed role is therefore an estimate, not a verified fact. Nicknames, avatars and levels are direct FACEIT data.

After uploading this version to GitHub, run the `Update FACEIT statistics` workflow once. The generated JSON will immediately replace the empty roster with the current FACEIT team roster.
