alter table public.iste_roster
  add column if not exists real_name_uk text not null default '',
  add column if not exists real_name_en text not null default '';

update public.iste_roster
set
  real_name_uk = case lower(nickname)
    when 'droni452' then 'Микита'
    when 'valaf' then 'Валентин'
    when '1sagi' then 'Сергій'
    when 'tw3ntyq' then 'Олександр'
    else real_name_uk
  end,
  real_name_en = case lower(nickname)
    when 'droni452' then 'Nikita'
    when 'valaf' then 'Valentyn'
    when '1sagi' then 'Serhii'
    when 'tw3ntyq' then 'Oleksandr'
    else real_name_en
  end;
