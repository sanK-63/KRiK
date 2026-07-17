#include "ui/pages/CinemaPage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "ui/MainWindow.h"

#include <QScrollArea>
#include <QLabel>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QPushButton>
#include "ui/components/ClickableFrame.h"
#include <QJsonArray>
#include <QDialog>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QPixmap>

CinemaPage::CinemaPage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
    loadMovies();
}

void CinemaPage::setupUi()
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

    auto *titleLabel = new QLabel(QString::fromUtf8("Kino"));
    titleLabel->setStyleSheet("color: #FA6814; font-size: 20px; font-weight: bold;");
    m_mainLayout->addWidget(titleLabel);

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

void CinemaPage::loadMovies()
{
    m_loadingLabel->show();
    m_gridContainer->hide();

    Application::instance()->httpClient()->get("/api/movies",
        [this](const QJsonObject &resp) {
            QJsonArray movies;
            if (resp.contains("movies")) {
                movies = resp["movies"].toArray();
            } else {
                for (auto it = resp.constBegin(); it != resp.constEnd(); ++it) {
                    if (it.value().isArray()) { movies = it.value().toArray(); break; }
                }
            }
            renderMovies(movies);
        },
        [this](const QString &err) {
            m_loadingLabel->setText(QString::fromUtf8("Oshibka: %1").arg(err));
        }
    );
}

void CinemaPage::renderMovies(const QJsonArray &movies)
{
    m_loadingLabel->hide();
    m_gridContainer->show();

    QLayoutItem *item;
    while ((item = m_gridLayout->takeAt(0)) != nullptr) {
        if (item->widget()) item->widget()->deleteLater();
        delete item;
    }

    int col = 0;
    int cols = 4;
    for (const auto &m : movies) {
        QJsonObject movie = m.toObject();

        QString title = movie.value("title").toString();
        int year = movie.value("year").toInt(0);
        QString genre = movie.value("genre").toString();
        double rating = movie.value("rating").toDouble(0.0);
        QString posterUrl = movie.value("posterUrl").toString();

        auto *card = new ClickableFrame();
        card->setObjectName("movieCard");
        card->setStyleSheet(
            "QFrame#movieCard { background: #2a2a2a; border: 1px solid #3b3b3b; "
            "border-radius: 8px; }"
            "QFrame#movieCard:hover { border: 1px solid #FA6814; }");
        card->setCursor(Qt::PointingHandCursor);

        auto *cardLayout = new QVBoxLayout(card);
        cardLayout->setContentsMargins(10, 10, 10, 12);
        cardLayout->setSpacing(6);

        auto *posterLabel = new QLabel();
        posterLabel->setFixedHeight(220);
        posterLabel->setAlignment(Qt::AlignCenter);
        posterLabel->setStyleSheet("background: #1a1a1a; border-radius: 6px;");
        posterLabel->setText(QString::fromUtf8("..."));

        if (!posterUrl.isEmpty()) {
            auto *nm = new QNetworkAccessManager(posterLabel);
            QNetworkRequest request(posterUrl);
            auto *reply = nm->get(request);
            connect(reply, &QNetworkReply::finished, this, [posterLabel, nm, reply]() {
                if (reply->error() == QNetworkReply::NoError) {
                    QPixmap pixmap;
                    pixmap.loadFromData(reply->readAll());
                    if (!pixmap.isNull()) {
                        posterLabel->setPixmap(pixmap.scaled(
                            posterLabel->width(), posterLabel->height(),
                            Qt::KeepAspectRatio, Qt::SmoothTransformation));
                    }
                }
                nm->deleteLater();
                reply->deleteLater();
            });
        }
        cardLayout->addWidget(posterLabel);

        auto *titleLabel = new QLabel(title);
        titleLabel->setStyleSheet("color: #F2F2F2; font-size: 13px; font-weight: bold;");
        titleLabel->setWordWrap(true);
        cardLayout->addWidget(titleLabel);

        auto *metaLabel = new QLabel(QString::fromUtf8("%1 \u2022 %2").arg(
            year > 0 ? QString::number(year) : QString::fromUtf8("N/A"), genre));
        metaLabel->setStyleSheet("color: #888; font-size: 11px;");
        cardLayout->addWidget(metaLabel);

        QString stars;
        int fullStars = static_cast<int>(rating);
        for (int i = 0; i < 5; i++) {
            stars += (i < fullStars) ? QString::fromUtf8("\u2605") : QString::fromUtf8("\u2606");
        }
        stars += QString(" %1").arg(rating, 0, 'f', 1);
        auto *ratingLabel = new QLabel(stars);
        ratingLabel->setStyleSheet("color: #FA6814; font-size: 12px;");
        cardLayout->addWidget(ratingLabel);

        connect(card, &ClickableFrame::clicked, this, [this, movie]() { showMovieDialog(movie); });

        m_gridLayout->addWidget(card, m_gridLayout->count() / cols, col);
        col++;
        if (col >= cols) col = 0;
    }

    if (movies.isEmpty()) {
        auto *empty = new QLabel(QString::fromUtf8("Filmy ne naydeny"));
        empty->setAlignment(Qt::AlignCenter);
        empty->setStyleSheet("color: #888; font-size: 14px; padding: 48px;");
        m_gridLayout->addWidget(empty, 0, 0, 1, cols);
    }
}

void CinemaPage::showMovieDialog(const QJsonObject &movie)
{
    auto *dialog = new QDialog(this);
    dialog->setWindowTitle(movie.value("title").toString());
    dialog->setMinimumWidth(550);
    dialog->setMinimumHeight(450);
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

    auto *topRow = new QHBoxLayout();
    topRow->setSpacing(16);

    auto *posterLabel = new QLabel();
    posterLabel->setFixedSize(180, 260);
    posterLabel->setAlignment(Qt::AlignCenter);
    posterLabel->setStyleSheet("background: #2a2a2a; border-radius: 6px;");
    QString posterUrl = movie.value("posterUrl").toString();
    if (!posterUrl.isEmpty()) {
        auto *nm = new QNetworkAccessManager(posterLabel);
        QNetworkRequest request(posterUrl);
        auto *reply = nm->get(request);
        connect(reply, &QNetworkReply::finished, this, [posterLabel, nm, reply]() {
            if (reply->error() == QNetworkReply::NoError) {
                QPixmap pixmap;
                pixmap.loadFromData(reply->readAll());
                if (!pixmap.isNull()) {
                    posterLabel->setPixmap(pixmap.scaled(180, 260,
                        Qt::KeepAspectRatio, Qt::SmoothTransformation));
                }
            }
            nm->deleteLater();
            reply->deleteLater();
        });
    }
    topRow->addWidget(posterLabel);

    auto *infoLayout = new QVBoxLayout();
    infoLayout->setSpacing(8);

    auto *titleLabel = new QLabel(movie.value("title").toString());
    titleLabel->setStyleSheet("color: #FA6814; font-size: 20px; font-weight: bold;");
    titleLabel->setWordWrap(true);
    infoLayout->addWidget(titleLabel);

    int year = movie.value("year").toInt(0);
    if (year > 0) {
        auto *yearLabel = new QLabel(QString::fromUtf8("God: %1").arg(year));
        yearLabel->setStyleSheet("color: #F2F2F2; font-size: 13px;");
        infoLayout->addWidget(yearLabel);
    }

    QString genre = movie.value("genre").toString();
    if (!genre.isEmpty()) {
        auto *genreBadge = new QLabel(genre);
        genreBadge->setAlignment(Qt::AlignCenter);
        genreBadge->setFixedWidth(100);
        genreBadge->setStyleSheet(
            "background: #FA6814; color: #1a1a1a; font-size: 11px; font-weight: bold; "
            "padding: 4px 10px; border-radius: 4px;");
        infoLayout->addWidget(genreBadge);
    }

    double rating = movie.value("rating").toDouble(0.0);
    if (rating > 0) {
        QString stars;
        int fullStars = static_cast<int>(rating);
        for (int i = 0; i < 5; i++) {
            stars += (i < fullStars) ? QString::fromUtf8("\u2605") : QString::fromUtf8("\u2606");
        }
        auto *ratingLabel = new QLabel(stars + QString(" %1").arg(rating, 0, 'f', 1));
        ratingLabel->setStyleSheet("color: #FA6814; font-size: 16px;");
        infoLayout->addWidget(ratingLabel);
    }

    infoLayout->addStretch();
    topRow->addLayout(infoLayout, 1);
    layout->addLayout(topRow);

    QString description = movie.value("description").toString();
    if (!description.isEmpty()) {
        auto *descTitle = new QLabel(QString::fromUtf8("Opisanie:"));
        descTitle->setStyleSheet("color: #FA6814; font-size: 14px; font-weight: bold;");
        layout->addWidget(descTitle);

        auto *descLabel = new QLabel(description);
        descLabel->setStyleSheet("color: #F2F2F2; font-size: 13px;");
        descLabel->setWordWrap(true);
        layout->addWidget(descLabel);
    }

    layout->addStretch();
    dialogScroll->setWidget(inner);

    auto *dlgLayout = new QVBoxLayout(dialog);
    dlgLayout->setContentsMargins(0, 0, 0, 0);
    dlgLayout->addWidget(dialogScroll);

    dialog->exec();
    dialog->deleteLater();
}
