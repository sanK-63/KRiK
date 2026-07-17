#include "ui/pages/MemesPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"

#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QPushButton>
#include <QFrame>
#include <QDialog>
#include <QLineEdit>
#include <QFileDialog>
#include <QJsonArray>
#include <QJsonDocument>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QPixmap>

MemesPage::MemesPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadMemes();
}

void MemesPage::setupUi()
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

    auto *titleLabel = new QLabel(QString::fromUtf8("Memy"));
    titleLabel->setStyleSheet("color: #FA6814; font-size: 20px; font-weight: bold;");
    headerRow->addWidget(titleLabel);
    headerRow->addStretch();

    auto *addBtn = new QPushButton(QString::fromUtf8("+ Novyi mem"));
    addBtn->setObjectName("accentButton");
    addBtn->setStyleSheet(
        "QPushButton { background: #FA6814; color: #1a1a1a; font-weight: bold; "
        "padding: 8px 20px; border-radius: 6px; border: none; font-size: 13px; }"
        "QPushButton:hover { background: #e05a10; }");
    connect(addBtn, &QPushButton::clicked, this, &MemesPage::showCreateDialog);
    headerRow->addWidget(addBtn);

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

void MemesPage::loadMemes()
{
    m_loadingLabel->show();
    m_gridContainer->hide();

    Application::instance()->httpClient()->get("/api/memes",
        [this](const QJsonObject &resp) {
            QJsonArray memes;
            if (resp.contains("memes")) {
                memes = resp["memes"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { memes = it.value().toArray(); break; }
                }
            }
            renderMemes(memes);
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka: %1").arg(err));
        }
    );
}

QWidget *MemesPage::createMemeCard(const QJsonObject &meme)
{
    QString id = meme.value("_id").toString();
    QString title = meme.value("title").toString();
    QString imageUrl = meme.value("imageUrl").toString();
    QString authorName = meme.value("authorName").toString();
    if (authorName.isEmpty()) {
        QJsonObject author = meme.value("author").toObject();
        authorName = author.value("displayName").toString();
    }
    QString date = meme.value("createdAt").toString().left(10);
    int likes = meme.value("likes").toInt(0);

    auto *card = new QFrame();
    card->setObjectName("memeCard");
    card->setStyleSheet(
        "QFrame#memeCard { background: #2a2a2a; border: 1px solid #3b3b3b; "
        "border-radius: 8px; }"
        "QFrame#memeCard:hover { border: 1px solid #FA6814; }");

    auto *cardLayout = new QVBoxLayout(card);
    cardLayout->setContentsMargins(12, 12, 12, 12);
    cardLayout->setSpacing(8);

    auto *imageLabel = new QLabel();
    imageLabel->setFixedHeight(200);
    imageLabel->setAlignment(Qt::AlignCenter);
    imageLabel->setStyleSheet("background: #1a1a1a; border-radius: 6px;");
    imageLabel->setText(QString::fromUtf8("Zagruzka..."));

    if (!imageUrl.isEmpty()) {
        auto *nm = new QNetworkAccessManager(imageLabel);
        QNetworkRequest request(imageUrl);
        auto *reply = nm->get(request);
        connect(reply, &QNetworkReply::finished, this, [imageLabel, nm, reply]() {
            if (reply->error() == QNetworkReply::NoError) {
                QPixmap pixmap;
                pixmap.loadFromData(reply->readAll());
                if (!pixmap.isNull()) {
                    imageLabel->setPixmap(pixmap.scaled(
                        imageLabel->size(), Qt::KeepAspectRatio, Qt::SmoothTransformation));
                } else {
                    imageLabel->setText(QString::fromUtf8("Izobrazhenie ne zagruzheno"));
                }
            } else {
                imageLabel->setText(QString::fromUtf8("Oshibka zagruzki"));
            }
            nm->deleteLater();
            reply->deleteLater();
        });
    }
    cardLayout->addWidget(imageLabel);

    auto *titleLabel = new QLabel(title);
    titleLabel->setStyleSheet("color: #F2F2F2; font-size: 14px; font-weight: bold;");
    titleLabel->setWordWrap(true);
    cardLayout->addWidget(titleLabel);

    auto *metaLabel = new QLabel(QString::fromUtf8("%1 \u2022 %2").arg(authorName, date));
    metaLabel->setStyleSheet("color: #888; font-size: 11px;");
    cardLayout->addWidget(metaLabel);

    auto *bottomRow = new QHBoxLayout();
    bottomRow->setSpacing(8);

    auto *likesLabel = new QLabel(QString::fromUtf8("\u2764 %1").arg(likes));
    likesLabel->setStyleSheet("color: #FA6814; font-size: 13px;");
    bottomRow->addWidget(likesLabel);

    bottomRow->addStretch();

    auto *likeBtn = new QPushButton(QString::fromUtf8("Like"));
    likeBtn->setStyleSheet(
        "QPushButton { background: #3b3b3b; color: #F2F2F2; padding: 4px 12px; "
        "border-radius: 4px; border: none; font-size: 12px; }"
        "QPushButton:hover { background: #FA6814; color: #1a1a1a; }");
    connect(likeBtn, &QPushButton::clicked, this, [this, id, likesLabel]() {
        likeMeme(id, likesLabel);
    });
    bottomRow->addWidget(likeBtn);

    cardLayout->addLayout(bottomRow);

    return card;
}

void MemesPage::renderMemes(const QJsonArray &memes)
{
    m_memes = memes;
    m_loadingLabel->hide();
    m_gridContainer->show();

    QLayoutItem *item;
    while ((item = m_gridLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    int col = 0;
    int cols = 3;
    for (const auto &m : memes) {
        QJsonObject meme = m.toObject();
        auto *card = createMemeCard(meme);
        m_gridLayout->addWidget(card, m_gridLayout->count() / cols, col);
        col++;
        if (col >= cols) col = 0;
    }

    if (memes.isEmpty()) {
        auto *empty = new QLabel(QString::fromUtf8("Memy ne naydeny"));
        empty->setAlignment(Qt::AlignCenter);
        empty->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
        m_gridLayout->addWidget(empty, 0, 0, 1, cols);
    }
}

void MemesPage::likeMeme(const QString &id, QLabel *likesLabel)
{
    Application::instance()->httpClient()->post(
        "/api/memes/" + id + "/like", QJsonObject(),
        [this, id, likesLabel](const QJsonObject &) {
            for (const auto &m : m_memes) {
                QJsonObject meme = m.toObject();
                if (meme.value("_id").toString() == id) {
                    int newLikes = meme.value("likes").toInt(0) + 1;
                    meme["likes"] = newLikes;
                    likesLabel->setText(QString::fromUtf8("\u2764 %1").arg(newLikes));
                    break;
                }
            }
        },
        [](const QString &) {}
    );
}

void MemesPage::showCreateDialog()
{
    auto *dialog = new QDialog(this);
    dialog->setWindowTitle(QString::fromUtf8("Novyi mem"));
    dialog->setMinimumWidth(400);
    dialog->setStyleSheet(
        "QDialog { background: #1a1a1a; }"
        "QLabel { color: #F2F2F2; font-size: 13px; }"
        "QLineEdit { background: #2a2a2a; color: #F2F2F2; border: 1px solid #3b3b3b; "
        "padding: 8px; border-radius: 4px; font-size: 13px; }"
        "QPushButton { background: #FA6814; color: #1a1a1a; font-weight: bold; "
        "padding: 8px 16px; border-radius: 4px; border: none; }"
        "QPushButton:hover { background: #e05a10; }");

    auto *layout = new QVBoxLayout(dialog);
    layout->setSpacing(12);
    layout->setContentsMargins(20, 20, 20, 20);

    layout->addWidget(new QLabel(QString::fromUtf8("Nazvanie:")));
    auto *titleEdit = new QLineEdit();
    titleEdit->setPlaceholderText(QString::fromUtf8("Nazvanie mema..."));
    layout->addWidget(titleEdit);

    auto *browseRow = new QHBoxLayout();
    auto *pathEdit = new QLineEdit();
    pathEdit->setPlaceholderText(QString::fromUtf8("Put' k izobrazheniyu..."));
    pathEdit->setReadOnly(true);
    browseRow->addWidget(pathEdit);

    auto *browseBtn = new QPushButton(QString::fromUtf8("Obzor"));
    connect(browseBtn, &QPushButton::clicked, this, [pathEdit]() {
        QString file = QFileDialog::getOpenFileName(
            nullptr, QString::fromUtf8("Vybrat' izobrazhenie"), QString(),
            "Images (*.png *.jpg *.jpeg *.gif)");
        if (!file.isEmpty()) pathEdit->setText(file);
    });
    browseRow->addWidget(browseBtn);
    layout->addLayout(browseRow);

    auto *submitBtn = new QPushButton(QString::fromUtf8("Sozdat'"));
    connect(submitBtn, &QPushButton::clicked, this, [this, dialog, titleEdit, pathEdit]() {
        QJsonObject body;
        body["title"] = titleEdit->text();
        body["imageUrl"] = pathEdit->text();

        Application::instance()->httpClient()->post("/api/memes", body,
            [this, dialog](const QJsonObject &) {
                dialog->accept();
                loadMemes();
            },
            [](const QString &) {}
        );
    });
    layout->addWidget(submitBtn);

    dialog->exec();
    dialog->deleteLater();
}
