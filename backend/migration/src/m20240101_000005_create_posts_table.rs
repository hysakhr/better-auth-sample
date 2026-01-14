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
                    .table(Posts::Table)
                    .if_not_exists()
                    .col(pk_auto(Posts::Id))
                    .col(string(Posts::UserId))
                    .col(string(Posts::Title))
                    .col(string(Posts::Content))
                    .col(boolean(Posts::Published).default(false))
                    .col(
                        timestamp_with_time_zone(Posts::CreatedAt)
                            .default(Expr::current_timestamp())
                            .not_null(),
                    )
                    .col(
                        timestamp_with_time_zone(Posts::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_posts_user_id")
                            .from(Posts::Table, Posts::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // インデックス作成
        manager
            .create_index(
                Index::create()
                    .name("idx_posts_user_id")
                    .table(Posts::Table)
                    .col(Posts::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_posts_published")
                    .table(Posts::Table)
                    .col(Posts::Published)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Posts::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Posts {
    Table,
    Id,
    UserId,
    Title,
    Content,
    Published,
    CreatedAt,
    UpdatedAt,
}
