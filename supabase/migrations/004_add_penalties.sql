alter table match_data add column if not exists real_penalties_winner text;

alter table prediction_data add column if not exists penalties_winner text;
