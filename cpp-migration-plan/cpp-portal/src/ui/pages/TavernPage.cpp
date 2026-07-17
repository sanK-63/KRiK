#include "ui/pages/TavernPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"

#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QPushButton>
#include "ui/components/ClickableFrame.h"
#include <QFrame>
#include <QJsonArray>
#include <QDialog>
#include <QScrollArea>

TavernPage::TavernPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadRecipes();
}

void TavernPage::setupUi()
{
    auto *scroll = new QScrollArea(this);
    scroll->setWidgetResizable(true);
    scroll->setFrameShape(QFrame::NoFrame);
    scroll->setStyleSheet("QScrollArea { background: transparent; }");

    auto *content = new QWidget();
    content->setStyleSheet("background: transparent;");
    m_mainLayout = new QVBoxLayout(content);
    m_mainLayout->setContentsMargins(24, 24, 24, 24);
    m_mainLayout->setSpacing(20);

    auto *titleLabel = new QLabel(QString::fromUtf8("Taverna"));
    titleLabel->setStyleSheet("color: #FA6814; font-size: 20px; font-weight: bold;");
    m_mainLayout->addWidget(titleLabel);

    auto *tabsWidget = new QWidget();
    tabsWidget->setStyleSheet("background: transparent;");
    m_tabsLayout = new QHBoxLayout(tabsWidget);
    m_tabsLayout->setContentsMargins(0, 0, 0, 0);
    m_tabsLayout->setSpacing(8);
    m_tabsLayout->addStretch();
    m_mainLayout->addWidget(tabsWidget);

    m_loadingLabel = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingLabel->setAlignment(Qt::AlignCenter);
    m_loadingLabel->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
    m_mainLayout->addWidget(m_loadingLabel);

    m_cardsContainer = new QWidget();
    m_cardsContainer->setStyleSheet("background: transparent;");
    m_cardsLayout = new QVBoxLayout(m_cardsContainer);
    m_cardsLayout->setContentsMargins(0, 0, 0, 0);
    m_cardsLayout->setSpacing(12);
    m_mainLayout->addWidget(m_cardsContainer);

    m_mainLayout->addStretch();
    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void TavernPage::loadRecipes()
{
    m_loadingLabel->show();
    m_cardsContainer->hide();

    Application::instance()->httpClient()->get("/api/recipes",
        [this](const QJsonObject &resp) {
            QJsonArray recipes;
            if (resp.contains("recipes")) {
                recipes = resp["recipes"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { recipes = it.value().toArray(); break; }
                }
            }

            QSet<QString> categories;
            for (const auto &r : recipes) {
                QString cat = r.toObject().value("category").toString();
                if (!cat.isEmpty()) categories.insert(cat);
            }

            QLayoutItem *item;
            while ((item = m_tabsLayout->takeAt(0)) != nullptr) {
                if (item->widget()) item->widget()->deleteLater();
                delete item;
            }

            auto *allBtn = new QPushButton(QString::fromUtf8("Vse"));
            allBtn->setStyleSheet(
                "QPushButton { background: #FA6814; color: #1a1a1a; font-weight: bold; "
                "padding: 6px 14px; border-radius: 4px; border: none; font-size: 12px; }"
                "QPushButton:hover { background: #e05a10; }");
            connect(allBtn, &QPushButton::clicked, this, [this]() { filterByCategory(""); });
            m_tabsLayout->addWidget(allBtn);

            for (const auto &cat : categories) {
                auto *btn = new QPushButton(cat);
                btn->setStyleSheet(
                    "QPushButton { background: #3b3b3b; color: #F2F2F2; "
                    "padding: 6px 14px; border-radius: 4px; border: none; font-size: 12px; }"
                    "QPushButton:hover { background: #FA6814; color: #1a1a1a; }");
                connect(btn, &QPushButton::clicked, this, [this, cat]() { filterByCategory(cat); });
                m_tabsLayout->addWidget(btn);
            }
            m_tabsLayout->addStretch();

            m_recipes = recipes;
            filterByCategory("");
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka: %1").arg(err));
        }
    );
}

void TavernPage::filterByCategory(const QString &category)
{
    m_activeFilter = category;
    QLayoutItem *item;
    while ((item = m_cardsLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    m_loadingLabel->hide();
    m_cardsContainer->show();

    int count = 0;
    for (const auto &r : m_recipes) {
        QJsonObject recipe = r.toObject();
        QString cat = recipe.value("category").toString();
        if (!category.isEmpty() && cat != category) continue;

        QString name = recipe.value("name").toString();
        QString description = recipe.value("description").toString();
        QJsonArray ingredients = recipe.value("ingredients").toArray();
        QString categoryBadge = recipe.value("category").toString();

        auto *card = new ClickableFrame();
        card->setObjectName("recipeCard");
        card->setStyleSheet(
            "QFrame#recipeCard { background: #2a2a2a; border: 1px solid #3b3b3b; "
            "border-radius: 8px; }"
            "QFrame#recipeCard:hover { border: 1px solid #FA6814; }");
        card->setCursor(Qt::PointingHandCursor);

        auto *cardLayout = new QHBoxLayout(card);
        cardLayout->setContentsMargins(20, 16, 20, 16);
        cardLayout->setSpacing(16);

        auto *infoLayout = new QVBoxLayout();
        infoLayout->setSpacing(6);

        auto *nameLabel = new QLabel(name);
        nameLabel->setStyleSheet("color: #F2F2F2; font-size: 15px; font-weight: bold;");
        nameLabel->setWordWrap(true);
        infoLayout->addWidget(nameLabel);

        QString truncatedDesc = description;
        if (truncatedDesc.length() > 120) truncatedDesc = truncatedDesc.left(117) + "...";
        auto *descLabel = new QLabel(truncatedDesc);
        descLabel->setStyleSheet("color: #888; font-size: 12px;");
        descLabel->setWordWrap(true);
        infoLayout->addWidget(descLabel);

        if (!ingredients.isEmpty()) {
            QStringList ingrList;
            for (const auto &ing : ingredients) ingrList.append(ing.toString());
            QString ingrText = ingrList.join(", ");
            if (ingrText.length() > 100) ingrText = ingrText.left(97) + "...";
            auto *ingrLabel = new QLabel(QString::fromUtf8("Sostav: %1").arg(ingrText));
            ingrLabel->setStyleSheet("color: #888; font-size: 11px;");
            ingrLabel->setWordWrap(true);
            infoLayout->addWidget(ingrLabel);
        }

        cardLayout->addLayout(infoLayout, 1);

        if (!categoryBadge.isEmpty()) {
            auto *badge = new QLabel(categoryBadge);
            badge->setAlignment(Qt::AlignCenter);
            badge->setStyleSheet(
                "background: #FA6814; color: #1a1a1a; font-size: 11px; font-weight: bold; "
                "padding: 4px 10px; border-radius: 4px;");
            cardLayout->addWidget(badge, 0, Qt::AlignVCenter);
        }

        connect(card, &ClickableFrame::clicked, this, [this, recipe]() { showRecipeDialog(recipe); });

        m_cardsLayout->addWidget(card);
        count++;
    }

    if (count == 0) {
        auto *empty = new QLabel(QString::fromUtf8("Recepty ne naydeny"));
        empty->setAlignment(Qt::AlignCenter);
        empty->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
        m_cardsLayout->addWidget(empty);
    }
}

void TavernPage::showRecipeDialog(const QJsonObject &recipe)
{
    auto *dialog = new QDialog(this);
    dialog->setWindowTitle(recipe.value("name").toString());
    dialog->setMinimumWidth(500);
    dialog->setMinimumHeight(400);
    dialog->setStyleSheet(
        "QDialog { background: #1a1a1a; }"
        "QLabel { color: #F2F2F2; }");

    auto *dialogScroll = new QScrollArea(dialog);
    dialogScroll->setWidgetResizable(true);
    dialogScroll->setFrameShape(QFrame::NoFrame);

    auto *inner = new QWidget();
    auto *layout = new QVBoxLayout(inner);
    layout->setContentsMargins(24, 24, 24, 24);
    layout->setSpacing(12);

    auto *nameLabel = new QLabel(recipe.value("name").toString());
    nameLabel->setStyleSheet("color: #FA6814; font-size: 18px; font-weight: bold;");
    layout->addWidget(nameLabel);

    QString cat = recipe.value("category").toString();
    if (!cat.isEmpty()) {
        auto *badge = new QLabel(cat);
        badge->setStyleSheet(
            "background: #FA6814; color: #1a1a1a; font-size: 11px; font-weight: bold; "
            "padding: 4px 10px; border-radius: 4px;");
        badge->setFixedWidth(100);
        badge->setAlignment(Qt::AlignCenter);
        layout->addWidget(badge);
    }

    auto *descLabel = new QLabel(recipe.value("description").toString());
    descLabel->setStyleSheet("color: #F2F2F2; font-size: 13px;");
    descLabel->setWordWrap(true);
    layout->addWidget(descLabel);

    QJsonArray ingredients = recipe.value("ingredients").toArray();
    if (!ingredients.isEmpty()) {
        auto *ingrTitle = new QLabel(QString::fromUtf8("Sostav:"));
        ingrTitle->setStyleSheet("color: #FA6814; font-size: 14px; font-weight: bold;");
        layout->addWidget(ingrTitle);

        for (const auto &ing : ingredients) {
            auto *ingrItem = new QLabel(QString::fromUtf8("\u2022 %1").arg(ing.toString()));
            ingrItem->setStyleSheet("color: #F2F2F2; font-size: 13px; padding-left: 12px;");
            ingrItem->setWordWrap(true);
            layout->addWidget(ingrItem);
        }
    }

    layout->addStretch();
    dialogScroll->setWidget(inner);

    auto *dlgLayout = new QVBoxLayout(dialog);
    dlgLayout->setContentsMargins(0, 0, 0, 0);
    dlgLayout->addWidget(dialogScroll);

    dialog->exec();
    dialog->deleteLater();
}
