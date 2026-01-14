use sea_orm_migration::{prelude::*, schema::*};

use crate::m20240101_000001_create_users_table::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Accounts::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Accounts::Id).string().not_null().primary_key())
                    .col(string(Accounts::UserId))
                    .col(string(Accounts::AccountId))
                    .col(string(Accounts::ProviderId))
                    .col(string_null(Accounts::AccessToken))
                    .col(string_null(Accounts::RefreshToken))
                    .col(timestamp_with_time_zone_null(Accounts::AccessTokenExpiresAt))
                    .col(timestamp_with_time_zone_null(Accounts::RefreshTokenExpiresAt))
                    .col(string_null(Accounts::Scope))
                    .col(string_null(Accounts::IdToken))
                    .col(string_null(Accounts::Password))
                    .col(
                        timestamp_with_time_zone(Accounts::CreatedAt)
                            .default(Expr::current_timestamp())
                            .not_null(),
                    )
                    .col(
                        timestamp_with_time_zone(Accounts::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_accounts_user_id")
                            .from(Accounts::Table, Accounts::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 複合ユニーク制約
        manager
            .create_index(
                Index::create()
                    .name("idx_accounts_provider_account")
                    .table(Accounts::Table)
                    .col(Accounts::ProviderId)
                    .col(Accounts::AccountId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // インデックス作成
        manager
            .create_index(
                Index::create()
                    .name("idx_accounts_user_id")
                    .table(Accounts::Table)
                    .col(Accounts::UserId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Accounts::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Accounts {
    Table,
    Id,
    UserId,
    AccountId,
    ProviderId,
    AccessToken,
    RefreshToken,
    AccessTokenExpiresAt,
    RefreshTokenExpiresAt,
    Scope,
    IdToken,
    Password,
    CreatedAt,
    UpdatedAt,
}
