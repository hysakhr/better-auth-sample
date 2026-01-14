use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Verifications::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Verifications::Id).string().not_null().primary_key())
                    .col(string(Verifications::Identifier))
                    .col(string(Verifications::Value))
                    .col(timestamp_with_time_zone(Verifications::ExpiresAt).not_null())
                    .col(
                        timestamp_with_time_zone(Verifications::CreatedAt)
                            .default(Expr::current_timestamp())
                            .not_null(),
                    )
                    .col(
                        timestamp_with_time_zone(Verifications::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;

        // インデックス作成
        manager
            .create_index(
                Index::create()
                    .name("idx_verifications_identifier")
                    .table(Verifications::Table)
                    .col(Verifications::Identifier)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_verifications_expires_at")
                    .table(Verifications::Table)
                    .col(Verifications::ExpiresAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Verifications::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Verifications {
    Table,
    Id,
    Identifier,
    Value,
    ExpiresAt,
    CreatedAt,
    UpdatedAt,
}
