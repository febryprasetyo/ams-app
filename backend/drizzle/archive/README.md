# Historical SQL drafts

These scripts were not registered in the Drizzle journal. The 0009–0012 drafts
are covered by the registered 0009_crazy_excalibur migration. The system settings
and attendance drafts are superseded by 0014_production_attendance_settings,
which also has the schema snapshot needed for future migration generation.

Do not apply these drafts separately. Production migrations run only from the
root drizzle directory using meta/_journal.json.
