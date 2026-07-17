#include "ui/pages/SoftwarePage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "network/AuthInterceptor.h"
#include "ui/MainWindow.h"

#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QPushButton>
#include <QFrame>
#include <QJsonArray>
#include <QDialog>
#include <QLineEdit>
#include <QTextEdit>
#include <QComboBox>
#include <QDesktopServices>
#include <QUrl>

SoftwarePage::SoftwarePage(QWidget *parent)
    : QWidget(parent)
{
    m_isAdmin = (Application::instance()->authManager()->user().value("username").toString() == "tunev");
    setupUi();
    loadSoftware();
}

void SoftwarePage::setupUi()
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

    auto *titleLabel = new QLabel(QString::fromUtf8("Programmnoe obespechenie"));
    titleLabel->setStyleSheet("color: #FA6814; font-size: 20px; font-weight: bold;");
    headerRow->addWidget(titleLabel);
    headerRow->addStretch();

    if (m_isAdmin) {
        auto *addBtn = new QPushButton(QString::fromUtf8("+ Dobavit'"));
        addBtn->setStyleSheet(
            "QPushButton { background: #FA6814; color: #1a1a1a; font-weight: bold; "
            "padding: 8px 20px; border-radius: 6px; border: none; font-size: 13px; }"
            "QPushButton:hover { background: #e05a10; }");
        connect(addBtn, &QPushButton::clicked, this, [this]() {
            showAddEditDialog(QJsonObject());
        });
        headerRow->addWidget(addBtn);
    }

    m_mainLayout->addLayout(headerRow);

    m_loadingLabel = new QLabel(QString::fromUtf8("Zagruzka..."));
    m_loadingLabel->setAlignment(Qt::AlignCenter);
    m_loadingLabel->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
    m_mainLayout->addWidget(m_loadingLabel);

    m_gridContainer = new QWidget();
    m_gridContainer->setStyleSheet("background: transparent;");
    m_gridLayout = new QGridLayout(m_gridContainer);
    m_gridLayout->setContentsMargins(0, 0, 0, 0);
    m_gridLayout->setSpacing(16);
    m_mainLayout->addWidget(m_gridContainer);

    m_mainLayout->addStretch();
    scroll->setWidget(content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(scroll);
}

void SoftwarePage::loadSoftware()
{
    m_loadingLabel->show();
    m_gridContainer->hide();

    Application::instance()->httpClient()->get("/api/software",
        [this](const QJsonObject &resp) {
            QJsonArray items;
            if (resp.contains("software")) {
                items = resp["software"].toArray();
            } else if (resp.contains("items")) {
                items = resp["items"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { items = it.value().toArray(); break; }
                }
            }
            renderSoftware(items);
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka: %1").arg(err));
        }
    );
}

QWidget *SoftwarePage::createSoftwareCard(const QJsonObject &item)
{
    QString id = item.value("_id").toString();
    QString title = item.value("title").toString();
    QString category = item.value("category").toString();
    QString version = item.value("version").toString();
    QString description = item.value("description").toString();
    QString downloadUrl = item.value("downloadUrl").toString();
    QJsonArray tags = item.value("tags").toArray();

    auto *card = new QFrame();
    card->setObjectName("swCard");
    card->setStyleSheet(
        "QFrame#swCard { background: #2a2a2a; border: 1px solid #3b3b3b; "
        "border-radius: 8px; }"
        "QFrame#swCard:hover { border: 1px solid #FA6814; }");

    auto *cardLayout = new QVBoxLayout(card);
    cardLayout->setContentsMargins(16, 14, 16, 14);
    cardLayout->setSpacing(8);

    auto *topRow = new QHBoxLayout();
    topRow->setSpacing(10);

    auto *titleLabel = new QLabel(title);
    titleLabel->setStyleSheet("color: #F2F2F2; font-size: 14px; font-weight: bold;");
    titleLabel->setWordWrap(true);
    topRow->addWidget(titleLabel, 1);

    if (!category.isEmpty()) {
        auto *catBadge = new QLabel(category);
        catBadge->setAlignment(Qt::AlignCenter);
        catBadge->setStyleSheet(
            "background: #FA6814; color: #1a1a1a; font-size: 10px; font-weight: bold; "
            "padding: 3px 8px; border-radius: 4px;");
        topRow->addWidget(catBadge, 0, Qt::AlignVCenter);
    }
    cardLayout->addLayout(topRow);

    if (!version.isEmpty()) {
        auto *verLabel = new QLabel(QString::fromUtf8("Versiya: %1").arg(version));
        verLabel->setStyleSheet("color: #888; font-size: 11px;");
        cardLayout->addWidget(verLabel);
    }

    if (!tags.isEmpty()) {
        QStringList tagList;
        for (const auto &t : tags) tagList.append(t.toString());
        auto *tagsLabel = new QLabel(tagList.join(", "));
        tagsLabel->setStyleSheet("color: #888; font-size: 11px;");
        tagsLabel->setWordWrap(true);
        cardLayout->addWidget(tagsLabel);
    }

    if (!description.isEmpty()) {
        QString truncDesc = description;
        if (truncDesc.length() > 120) truncDesc = truncDesc.left(117) + "...";
        auto *descLabel = new QLabel(truncDesc);
        descLabel->setStyleSheet("color: #888; font-size: 12px;");
        descLabel->setWordWrap(true);
        cardLayout->addWidget(descLabel);
    }

    auto *bottomRow = new QHBoxLayout();
    bottomRow->setSpacing(8);
    bottomRow->addStretch();

    if (!downloadUrl.isEmpty()) {
        auto *dlBtn = new QPushButton(QString::fromUtf8("Skachat'"));
        dlBtn->setStyleSheet(
            "QPushButton { background: #FA6814; color: #1a1a1a; font-weight: bold; "
            "padding: 6px 16px; border-radius: 4px; border: none; font-size: 12px; }"
            "QPushButton:hover { background: #e05a10; }");
        connect(dlBtn, &QPushButton::clicked, this, [downloadUrl]() {
            QDesktopServices::openUrl(QUrl(downloadUrl));
        });
        bottomRow->addWidget(dlBtn);
    }

    if (m_isAdmin) {
        auto *editBtn = new QPushButton(QString::fromUtf8("Redaktirovat'"));
        editBtn->setStyleSheet(
            "QPushButton { background: #3b3b3b; color: #F2F2F2; "
            "padding: 6px 12px; border-radius: 4px; border: none; font-size: 12px; }"
            "QPushButton:hover { background: #555; }");
        connect(editBtn, &QPushButton::clicked, this, [this, item]() {
            showAddEditDialog(item);
        });
        bottomRow->addWidget(editBtn);
    }

    cardLayout->addLayout(bottomRow);

    return card;
}

void SoftwarePage::renderSoftware(const QJsonArray &items)
{
    m_loadingLabel->hide();
    m_gridContainer->show();

    QLayoutItem *item;
    while ((item = m_gridLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    int col = 0;
    int cols = 3;
    for (const auto &sw : items) {
        QJsonObject software = sw.toObject();
        auto *card = createSoftwareCard(software);
        m_gridLayout->addWidget(card, m_gridLayout->count() / cols, col);
        col++;
        if (col >= cols) col = 0;
    }

    if (items.isEmpty()) {
        auto *empty = new QLabel(QString::fromUtf8("Programmy ne naydeny"));
        empty->setAlignment(Qt::AlignCenter);
        empty->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
        m_gridLayout->addWidget(empty, 0, 0, 1, cols);
    }
}

void SoftwarePage::showAddEditDialog(const QJsonObject &existing)
{
    bool isEdit = !existing.isEmpty();

    auto *dialog = new QDialog(this);
    dialog->setWindowTitle(isEdit ? QString::fromUtf8("Redaktirovat'") :
        QString::fromUtf8("Dobavit' programmu"));
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
    titleEdit->setText(existing.value("title").toString());
    titleEdit->setPlaceholderText(QString::fromUtf8("Nazvanie programmy..."));
    layout->addWidget(titleEdit);

    layout->addWidget(new QLabel(QString::fromUtf8("Kategoriya:")));
    auto *categoryCombo = new QComboBox();
    categoryCombo->addItems({QString::fromUtf8("Utility"), "Browser",
        QString::fromUtf8("Razrabotka"), QString::fromUtf8("Ofis"),
        QString::fromUtf8("Media"), "Other"});
    int catIdx = categoryCombo->findText(existing.value("category").toString());
    if (catIdx >= 0) categoryCombo->setCurrentIndex(catIdx);
    layout->addWidget(categoryCombo);

    layout->addWidget(new QLabel(QString::fromUtf8("Versiya:")));
    auto *versionEdit = new QLineEdit();
    versionEdit->setText(existing.value("version").toString());
    versionEdit->setPlaceholderText("1.0.0");
    layout->addWidget(versionEdit);

    layout->addWidget(new QLabel(QString::fromUtf8("Tagi (cherez zapyatuyu):")));
    auto *tagsEdit = new QLineEdit();
    QJsonArray existingTags = existing.value("tags").toArray();
    QStringList tagStrings;
    for (const auto &t : existingTags) tagStrings.append(t.toString());
    tagsEdit->setText(tagStrings.join(", "));
    tagsEdit->setPlaceholderText(QString::fromUtf8("tag1, tag2, tag3"));
    layout->addWidget(tagsEdit);

    layout->addWidget(new QLabel(QString::fromUtf8("Opisanie:")));
    auto *descEdit = new QTextEdit();
    descEdit->setPlainText(existing.value("description").toString());
    descEdit->setPlaceholderText(QString::fromUtf8("Opisanie programmy..."));
    descEdit->setMinimumHeight(80);
    layout->addWidget(descEdit);

    layout->addWidget(new QLabel(QString::fromUtf8("SSylka na skachivanie:")));
    auto *urlEdit = new QLineEdit();
    urlEdit->setText(existing.value("downloadUrl").toString());
    urlEdit->setPlaceholderText("https://...");
    layout->addWidget(urlEdit);

    auto *submitBtn = new QPushButton(isEdit ? QString::fromUtf8("Sokhranit'") :
        QString::fromUtf8("Dobavit'"));
    connect(submitBtn, &QPushButton::clicked, this, [this, dialog, isEdit, existing,
            titleEdit, categoryCombo, versionEdit, tagsEdit, descEdit, urlEdit]() {
        QJsonObject body;
        body["title"] = titleEdit->text();
        body["category"] = categoryCombo->currentText();
        body["version"] = versionEdit->text();
        body["description"] = descEdit->toPlainText();
        body["downloadUrl"] = urlEdit->text();

        QStringList tags = tagsEdit->text().split(",", Qt::SkipEmptyParts);
        QJsonArray tagsArr;
        for (auto &t : tags) tagsArr.append(t.trimmed());
        body["tags"] = tagsArr;

        if (isEdit) {
            QString id = existing.value("_id").toString();
            Application::instance()->httpClient()->put("/api/software/" + id, body,
                [this, dialog](const QJsonObject &) {
                    dialog->accept();
                    loadSoftware();
                },
                [](const QString &) {}
            );
        } else {
            Application::instance()->httpClient()->post("/api/software", body,
                [this, dialog](const QJsonObject &) {
                    dialog->accept();
                    loadSoftware();
                },
                [](const QString &) {}
            );
        }
    });
    layout->addWidget(submitBtn);

    dialog->exec();
    dialog->deleteLater();
}
