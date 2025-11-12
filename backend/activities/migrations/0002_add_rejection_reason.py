from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('activities', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE activities_activity "
                "ADD COLUMN IF NOT EXISTS rejection_reason text NULL;"
            ),
            reverse_sql=(
                "ALTER TABLE activities_activity "
                "DROP COLUMN IF EXISTS rejection_reason;"
            ),
        ),
    ]
