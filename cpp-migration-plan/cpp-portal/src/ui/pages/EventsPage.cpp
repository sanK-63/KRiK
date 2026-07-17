#include "ui/pages/EventsPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"

#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QPushButton>
#include <QFrame>
#include <QJsonArray>
#include <QDialog>
#include <QLineEdit>
#include <QTextEdit>
#include <QComboBox>

EventsPage::EventsPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadEvents();
}

void EventsPage::setupUi()
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

    auto *headerRow = new QHBoxLayout();
    headerRow->setSpacing(12);

    auto *titleLabel = new QLabel(QString::fromUtf8("Sobytiya"));
    titleLabel->setStyleSheet("color: #FA6814; font-size: 20px; font-weight: bold;");
    headerRow->addWidget(titleLabel);
    headerRow->addStretch();

    auto *addBtn = new QPushButton(QString::fromUtf8("+ Novoe sobytie"));
    addBtn->setObjectName("accentButton");
    addBtn->setStyleSheet(
        "QPushButton { background: #FA6814; color: #1a1a1a; font-weight: bold; "
        "padding: 8px 20px; border-radius: 6px; border: none; font-size: 13px; }"
        "QPushButton:hover { background: #e05a10; }");
    connect(addBtn, &QPushButton::clicked, this, &EventsPage::showCreateDialog);
    headerRow->addWidget(addBtn);

    m_mainLayout->addLayout(headerRow);

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

void EventsPage::loadEvents()
{
    m_loadingLabel->show();
    m_cardsContainer->hide();

    Application::instance()->httpClient()->get("/api/events",
        [this](const QJsonObject &resp) {
            QJsonArray events;
            if (resp.contains("events")) {
                events = resp["events"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { events = it.value().toArray(); break; }
                }
            }
            renderEvents(events);
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka: %1").arg(err));
        }
    );
}

void EventsPage::renderEvents(const QJsonArray &events)
{
    m_loadingLabel->hide();
    m_cardsContainer->show();

    QLayoutItem *item;
    while ((item = m_cardsLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    int count = 0;
    for (const auto &e : events) {
        QJsonObject event = e.toObject();

        QString title = event.value("title").toString();
        QString description = event.value("description").toString();
        QString date = event.value("date").toString();
        QString time = event.value("time").toString();
        QString location = event.value("location").toString();
        QString category = event.value("category").toString();

        auto *card = new QFrame();
        card->setObjectName("eventCard");
        card->setStyleSheet(
            "QFrame#eventCard { background: #2a2a2a; border: 1px solid #3b3b3b; "
            "border-radius: 8px; }"
            "QFrame#eventCard:hover { border: 1px solid #FA6814; }");

        auto *cardLayout = new QVBoxLayout(card);
        cardLayout->setContentsMargins(20, 16, 20, 16);
        cardLayout->setSpacing(8);

        auto *topRow = new QHBoxLayout();
        topRow->setSpacing(12);

        auto *titleLabel = new QLabel(title);
        titleLabel->setStyleSheet("color: #F2F2F2; font-size: 15px; font-weight: bold;");
        titleLabel->setWordWrap(true);
        topRow->addWidget(titleLabel, 1);

        if (!category.isEmpty()) {
            auto *badge = new QLabel(category);
            badge->setAlignment(Qt::AlignCenter);
            badge->setStyleSheet(
                "background: #FA6814; color: #1a1a1a; font-size: 11px; font-weight: bold; "
                "padding: 4px 10px; border-radius: 4px;");
            topRow->addWidget(badge, 0, Qt::AlignVCenter);
        }
        cardLayout->addLayout(topRow);

        auto *metaRow = new QHBoxLayout();
        metaRow->setSpacing(16);
        if (!date.isEmpty()) {
            auto *dateLabel = new QLabel(QString::fromUtf8("\U0001F4C5 %1").arg(date));
            dateLabel->setStyleSheet("color: #888; font-size: 12px;");
            metaRow->addWidget(dateLabel);
        }
        if (!time.isEmpty()) {
            auto *timeLabel = new QLabel(QString::fromUtf8("\U0001F552 %1").arg(time));
            timeLabel->setStyleSheet("color: #888; font-size: 12px;");
            metaRow->addWidget(timeLabel);
        }
        if (!location.isEmpty()) {
            auto *locLabel = new QLabel(QString::fromUtf8("\U0001F4CD %1").arg(location));
            locLabel->setStyleSheet("color: #888; font-size: 12px;");
            metaRow->addWidget(locLabel);
        }
        metaRow->addStretch();
        cardLayout->addLayout(metaRow);

        if (!description.isEmpty()) {
            QString truncated = description;
            if (truncated.length() > 150) truncated = truncated.left(147) + "...";
            auto *descLabel = new QLabel(truncated);
            descLabel->setStyleSheet("color: #888; font-size: 12px;");
            descLabel->setWordWrap(true);
            cardLayout->addWidget(descLabel);
        }

        m_cardsLayout->addWidget(card);
        count++;
    }

    if (count == 0) {
        auto *empty = new QLabel(QString::fromUtf8("Sobytiya ne naydeny"));
        empty->setAlignment(Qt::AlignCenter);
        empty->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
        m_cardsLayout->addWidget(empty);
    }
}

void EventsPage::showCreateDialog()
{
    auto *dialog = new QDialog(this);
    dialog->setWindowTitle(QString::fromUtf8("Novoe sobytie"));
    dialog->setMinimumWidth(450);
    dialog->setStyleSheet(
        "QDialog { background: #1a1a1a; }"
        "QLabel { color: #F2F2F2; font-size: 13px; }"
        "QLineEdit, QTextEdit, QComboBox { background: #2a2a2a; color: #F2F2F2; "
        "border: 1px solid #3b3b3b; padding: 8px; border-radius: 4px; font-size: 13px; }"
        "QComboBox::drop-down { border: none; }"
        "QComboBox QAbstractItemView { background: #2a2a2a; color: #F2F2F2; "
        "selection-background-color: #FA6814; }"
        "QPushButton { background: #FA6814; color: #1a1a1a; font-weight: bold; "
        "padding: 8px 16px; border-radius: 4px; border: none; }"
        "QPushButton:hover { background: #e05a10; }");

    auto *layout = new QVBoxLayout(dialog);
    layout->setSpacing(12);
    layout->setContentsMargins(20, 20, 20, 20);

    layout->addWidget(new QLabel(QString::fromUtf8("Nazvanie:")));
    auto *titleEdit = new QLineEdit();
    titleEdit->setPlaceholderText(QString::fromUtf8("Nazvanie sobytiya..."));
    layout->addWidget(titleEdit);

    auto *dateRow = new QHBoxLayout();
    dateRow->setSpacing(12);
    dateRow->addWidget(new QLabel(QString::fromUtf8("Data:")));
    auto *dateEdit = new QLineEdit();
    dateEdit->setPlaceholderText("YYYY-MM-DD");
    dateRow->addWidget(dateEdit);
    dateRow->addWidget(new QLabel(QString::fromUtf8("Vremya:")));
    auto *timeEdit = new QLineEdit();
    timeEdit->setPlaceholderText("HH:MM");
    dateRow->addWidget(timeEdit);
    layout->addLayout(dateRow);

    layout->addWidget(new QLabel(QString::fromUtf8("Mesto:")));
    auto *locationEdit = new QLineEdit();
    locationEdit->setPlaceholderText(QString::fromUtf8("Mesto provedeniya..."));
    layout->addWidget(locationEdit);

    layout->addWidget(new QLabel(QString::fromUtf8("Kategoriya:")));
    auto *categoryCombo = new QComboBox();
    categoryCombo->addItems({QString::fromUtf8("Vstrecha"), QString::fromUtf8("Soveshchanie"),
        QString::fromUtf8("Team-building"), QString::fromUtf8("Obuchenie"), "Other"});
    layout->addWidget(categoryCombo);

    layout->addWidget(new QLabel(QString::fromUtf8("Opisanie:")));
    auto *descEdit = new QTextEdit();
    descEdit->setPlaceholderText(QString::fromUtf8("Opisanie sobytiya..."));
    descEdit->setMinimumHeight(80);
    layout->addWidget(descEdit);

    auto *submitBtn = new QPushButton(QString::fromUtf8("Sozdat'"));
    connect(submitBtn, &QPushButton::clicked, this, [this, dialog, titleEdit, dateEdit,
            timeEdit, locationEdit, categoryCombo, descEdit]() {
        QJsonObject body;
        body["title"] = titleEdit->text();
        body["date"] = dateEdit->text();
        body["time"] = timeEdit->text();
        body["location"] = locationEdit->text();
        body["category"] = categoryCombo->currentText();
        body["description"] = descEdit->toPlainText();

        Application::instance()->httpClient()->post("/api/events", body,
            [this, dialog](const QJsonObject &) {
                dialog->accept();
                loadEvents();
            },
            [](const QString &) {}
        );
    });
    layout->addWidget(submitBtn);

    dialog->exec();
    dialog->deleteLater();
}
