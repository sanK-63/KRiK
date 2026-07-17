#include "ui/pages/ForumPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"

#include <QScrollArea>
#include <QTabWidget>
#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include "ui/components/ClickableFrame.h"
#include <QPushButton>
#include <QDialog>
#include <QLineEdit>
#include <QTextEdit>
#include <QComboBox>
#include <QJsonArray>
#include <QJsonObject>
#include <QJsonDocument>
#include <QMessageBox>

ForumPage::ForumPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadForum();
}

void ForumPage::setupUi()
{
    m_mainLayout = new QVBoxLayout(this);
    m_mainLayout->setContentsMargins(0, 0, 0, 0);
    m_mainLayout->setSpacing(0);

    auto *topBar = new QWidget();
    topBar->setStyleSheet("background: transparent;");
    auto *topLayout = new QHBoxLayout(topBar);
    topLayout->setContentsMargins(32, 20, 32, 8);

    auto *title = new QLabel(QString::fromUtf8("FORUM"));
    title->setStyleSheet(
        "font-family: 'Press Start 2P'; font-size: 18px; color: #FA6814; "
        "background: transparent;");
    topLayout->addWidget(title);
    topLayout->addStretch();

    auto *createBtn = new QPushButton(QString::fromUtf8("+ Novaya tema"));
    createBtn->setCursor(Qt::PointingHandCursor);
    createBtn->setStyleSheet(
        "QPushButton { background: #FA6814; color: #1a1a1a; font-size: 13px; "
        "font-weight: bold; padding: 8px 20px; border: none; border-radius: 6px; }"
        "QPushButton:hover { background: #e55a0e; }");
    connect(createBtn, &QPushButton::clicked, this, &ForumPage::openCreateDialog);
    topLayout->addWidget(createBtn);

    m_mainLayout->addWidget(topBar);

    m_loadingWidget = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingWidget->setStyleSheet("color: #888; font-size: 14px; padding: 64px;");
    qobject_cast<QLabel *>(m_loadingWidget)->setAlignment(Qt::AlignCenter);
    m_mainLayout->addWidget(m_loadingWidget);

    m_tabWidget = new QTabWidget();
    m_tabWidget->setStyleSheet(
        "QTabWidget::pane { border: none; background: transparent; }"
        "QTabBar::tab { background: #1a1a1a; color: #888; padding: 10px 24px; "
        "border: 1px solid #3b3b3b; border-bottom: none; border-radius: 6px 6px 0 0; "
        "margin-right: 2px; font-size: 13px; }"
        "QTabBar::tab:selected { background: #2a2a2a; color: #F2F2F2; }"
        "QTabBar::tab:hover { color: #FA6814; }");
    m_tabWidget->hide();
    m_mainLayout->addWidget(m_tabWidget, 1);
}

void ForumPage::loadForum()
{
    m_loadingWidget->show();
    m_tabWidget->hide();

    Application::instance()->httpClient()->get("/api/forum",
        [this](const QJsonObject &resp) {
            QJsonArray categories;
            QJsonArray topics;

            if (resp.contains("categories")) {
                categories = resp["categories"].toArray();
            }
            if (resp.contains("topics")) {
                topics = resp["topics"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) {
                        topics = it.value().toArray();
                        break;
                    }
                }
            }

            m_categories = categories;
            m_topics = topics;
            renderTabs(categories, topics);
        },
        [this](const QString &err) {
            m_loadingWidget->show();
            qobject_cast<QLabel *>(m_loadingWidget)->setText(
                QString::fromUtf8("Oshibka: %1").arg(err));
            m_tabWidget->hide();
        }
    );
}

void ForumPage::renderTabs(const QJsonArray &categories, const QJsonArray &topics)
{
    m_loadingWidget->hide();
    m_tabWidget->show();

    while (m_tabWidget->count() > 0) {
        QWidget *w = m_tabWidget->widget(0);
        m_tabWidget->removeTab(0);
        if (w) w->deleteLater();
    }

    QMap<QString, QJsonArray> grouped;
    for (const auto &t : topics) {
        QJsonObject topic = t.toObject();
        QString cat = topic.value("category").toString();
        if (cat.isEmpty()) cat = "Vse";
        grouped[cat].append(topic);
    }

    QStringList catNames;
    if (!categories.isEmpty()) {
        for (const auto &c : categories) {
            catNames.append(c.toObject().value("name").toString());
        }
    } else {
        catNames = grouped.keys();
        catNames.sort();
    }

    auto addTab = [&](const QString &name, const QJsonArray &items) {
        auto *scroll = new QScrollArea();
        scroll->setWidgetResizable(true);
        scroll->setFrameShape(QFrame::NoFrame);
        scroll->setStyleSheet("QScrollArea { background: transparent; }");

        auto *content = new QWidget();
        content->setStyleSheet("background: transparent;");
        auto *layout = new QVBoxLayout(content);
        layout->setContentsMargins(32, 16, 32, 32);
        layout->setSpacing(10);

        for (const auto &t : items) {
            layout->addWidget(createTopicCard(t.toObject()));
        }

        layout->addStretch();
        scroll->setWidget(content);
        m_tabWidget->addTab(scroll, name);
    };

    if (catNames.isEmpty()) {
        addTab(QString::fromUtf8("Vse temy"), topics);
    } else {
        for (const auto &name : catNames) {
            if (grouped.contains(name)) {
                addTab(name, grouped[name]);
            }
        }

        bool hasVse = std::any_of(catNames.begin(), catNames.end(),
            [](const QString &n) { return n == QString::fromUtf8("Vse"); });
        if (!hasVse && grouped.size() > 1) {
            QJsonArray all;
            for (auto it = grouped.constBegin(); it != grouped.constEnd(); ++it) {
                for (const auto &t : it.value()) all.append(t);
            }
            addTab(QString::fromUtf8("Vse"), all);
            m_tabWidget->insertTab(0, m_tabWidget->widget(m_tabWidget->count() - 1),
                QString::fromUtf8("Vse"));
            m_tabWidget->removeTab(m_tabWidget->count() - 1);
        }
    }
}

QWidget *ForumPage::createTopicCard(const QJsonObject &topic)
{
    QString id = topic.value("_id").toString();
    QString title = topic.value("title").toString();
    QString authorName = topic.value("authorName").toString();
    if (authorName.isEmpty()) {
        QJsonObject author = topic.value("author").toObject();
        authorName = author.value("displayName").toString();
    }
    QString category = topic.value("category").toString();
    QString createdAt = topic.value("createdAt").toString();
    int comments = topic.value("replies").toInt(0);
    if (comments == 0) comments = topic.value("commentCount").toInt(0);

    auto *card = new ClickableFrame();
    card->setObjectName("topicCard");
    card->setStyleSheet(
        "QFrame#topicCard { background: #2a2a2a; border: 1px solid #3b3b3b; "
        "border-radius: 8px; }"
        "QFrame#topicCard:hover { border: 1px solid #FA6814; }");
    card->setCursor(Qt::PointingHandCursor);

    auto *cardLayout = new QHBoxLayout(card);
    cardLayout->setContentsMargins(20, 16, 20, 16);
    cardLayout->setSpacing(16);

    auto *infoLayout = new QVBoxLayout();
    infoLayout->setSpacing(6);

    auto *titleLabel = new QLabel(title);
    titleLabel->setStyleSheet("color: #F2F2F2; font-size: 15px; font-weight: bold;");
    titleLabel->setWordWrap(true);
    infoLayout->addWidget(titleLabel);

    QString dateStr = createdAt.left(10);
    auto *metaLabel = new QLabel(
        QString::fromUtf8("%1 \u2022 %2 \u2022 %3 kommentariev")
            .arg(authorName, dateStr, QString::number(comments)));
    metaLabel->setStyleSheet("color: #888; font-size: 12px;");
    infoLayout->addWidget(metaLabel);

    cardLayout->addLayout(infoLayout, 1);

    if (!category.isEmpty()) {
        auto *badge = new QLabel(category);
        badge->setAlignment(Qt::AlignCenter);
        badge->setStyleSheet(
            "background: #FA6814; color: #1a1a1a; font-size: 11px; font-weight: bold; "
            "padding: 4px 10px; border-radius: 4px;");
        cardLayout->addWidget(badge, 0, Qt::AlignVCenter);
    }

    connect(card, &ClickableFrame::clicked, this, [id]() {
        if (auto *w = qobject_cast<MainWindow *>(qApp->activeWindow()))
            w->navigateTo("/forum/" + id);
    });

    return card;
}

void ForumPage::openCreateDialog()
{
    QDialog dialog(this);
    dialog.setWindowTitle(QString::fromUtf8("Novaya tema"));
    dialog.setMinimumWidth(500);
    dialog.setStyleSheet(
        "QDialog { background: #1a1a1a; }"
        "QLabel { color: #F2F2F2; font-size: 13px; }"
        "QLineEdit, QTextEdit { background: #2a2a2a; color: #F2F2F2; border: 1px solid #3b3b3b; "
        "border-radius: 6px; padding: 8px; font-size: 13px; }"
        "QLineEdit:focus, QTextEdit:focus { border: 1px solid #FA6814; }"
        "QPushButton { border: none; border-radius: 6px; padding: 8px 20px; font-size: 13px; "
        "font-weight: bold; }");

    auto *layout = new QVBoxLayout(&dialog);
    layout->setContentsMargins(24, 24, 24, 24);
    layout->setSpacing(12);

    layout->addWidget(new QLabel(QString::fromUtf8("Zagolovok")));
    auto *titleEdit = new QLineEdit();
    titleEdit->setPlaceholderText(QString::fromUtf8("Vvedite zagolovok..."));
    layout->addWidget(titleEdit);

    layout->addWidget(new QLabel(QString::fromUtf8("Kategoriya")));
    auto *categoryCombo = new QComboBox();
    categoryCombo->setStyleSheet(
        "QComboBox { background: #2a2a2a; color: #F2F2F2; border: 1px solid #3b3b3b; "
        "border-radius: 6px; padding: 8px; font-size: 13px; }"
        "QComboBox::drop-down { border: none; }"
        "QComboBox QAbstractItemView { background: #2a2a2a; color: #F2F2F2; "
        "selection-background-color: #FA6814; }");
    for (const auto &c : m_categories) {
        categoryCombo->addItem(c.toObject().value("name").toString());
    }
    if (categoryCombo->count() == 0) {
        categoryCombo->addItems(QStringList()
            << QString::fromUtf8("Obshchee")
            << QString::fromUtf8("Voprosy")
            << QString::fromUtf8("Idei")
            << QString::fromUtf8("Soobshcheniya"));
    }
    layout->addWidget(categoryCombo);

    layout->addWidget(new QLabel(QString::fromUtf8("Soderzhanie")));
    auto *contentEdit = new QTextEdit();
    contentEdit->setPlaceholderText(QString::fromUtf8("Napishite vaash tekst..."));
    contentEdit->setMinimumHeight(120);
    layout->addWidget(contentEdit);

    auto *btnRow = new QHBoxLayout();
    btnRow->addStretch();

    auto *cancelBtn = new QPushButton(QString::fromUtf8("Otmena"));
    cancelBtn->setStyleSheet(
        "QPushButton { background: #3b3b3b; color: #F2F2F2; }"
        "QPushButton:hover { background: #4a4a4a; }");
    connect(cancelBtn, &QPushButton::clicked, &dialog, &QDialog::reject);
    btnRow->addWidget(cancelBtn);

    auto *submitBtn = new QPushButton(QString::fromUtf8("Sozdat"));
    submitBtn->setStyleSheet(
        "QPushButton { background: #FA6814; color: #1a1a1a; }"
        "QPushButton:hover { background: #e55a0e; }");
    connect(submitBtn, &QPushButton::clicked, &dialog, &QDialog::accept);
    btnRow->addWidget(submitBtn);

    layout->addLayout(btnRow);

    if (dialog.exec() != QDialog::Accepted)
        return;

    QString titleText = titleEdit->text().trimmed();
    QString contentText = contentEdit->toPlainText().trimmed();
    QString categoryText = categoryCombo->currentText();

    if (titleText.isEmpty()) {
        QMessageBox::warning(this, QString::fromUtf8("Oshibka"),
            QString::fromUtf8("Zagolovok ne mozhet byt pustym"));
        return;
    }

    QJsonObject body;
    body["title"] = titleText;
    body["content"] = contentText;
    body["category"] = categoryText;

    Application::instance()->httpClient()->post("/api/forum/topics", body,
        [this](const QJsonObject &) {
            loadForum();
        },
        [this](const QString &err) {
            QMessageBox::warning(this, QString::fromUtf8("Oshibka"),
                QString::fromUtf8("Ne udalos sozdat temu: %1").arg(err));
        }
    );
}

void ForumPage::refresh()
{
    loadForum();
}
