#include "ui/pages/ProfilePage.h"
#include "core/Application.h"
#include "network/HttpClient.h"
#include "network/AuthInterceptor.h"
#include "ui/MainWindow.h"

#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QScrollArea>
#include <QFrame>
#include <QPushButton>
#include <QJsonArray>
#include <QJsonObject>

static const QString ACCENT = "#FA6814";
static const QString BG = "#2a2a2a";
static const QString BORDER = "#3b3b3b";
static const QString SECONDARY = "#888";
static const QString PRIMARY = "#F2F2F2";

ProfilePage::ProfilePage(QWidget *parent)
    : QWidget(parent)
{
    setupUi();
}

void ProfilePage::setUserId(int id)
{
    m_userId = id;
    loadProfile(id);
}

void ProfilePage::setupUi()
{
    m_scroll = new QScrollArea(this);
    m_scroll->setWidgetResizable(true);
    m_scroll->setFrameShape(QFrame::NoFrame);

    m_content = new QWidget();
    m_mainLayout = new QVBoxLayout(m_content);
    m_mainLayout->setContentsMargins(24, 24, 24, 24);
    m_mainLayout->setSpacing(16);

    auto *heading = new QLabel("PROFIL");
    heading->setStyleSheet("font-family: \"Press Start 2P\"; font-size: 14px; color: " + PRIMARY + ";");
    m_mainLayout->addWidget(heading);

    auto *infoCard = new QFrame();
    infoCard->setStyleSheet(
        "QFrame { background: " + BG + "; border: 1px solid " + BORDER + "; border-radius: 8px; padding: 24px; }"
    );
    auto *infoLayout = new QVBoxLayout(infoCard);
    infoLayout->setSpacing(12);

    auto *topRow = new QHBoxLayout();
    topRow->setSpacing(16);

    m_avatarLabel = new QLabel();
    m_avatarLabel->setFixedSize(96, 96);
    m_avatarLabel->setAlignment(Qt::AlignCenter);
    m_avatarLabel->setStyleSheet(
        "background: " + BORDER + "; border-radius: 48px; font-size: 36px; color: " + PRIMARY + "; font-weight: bold;"
    );
    m_avatarLabel->setText("?");
    topRow->addWidget(m_avatarLabel);

    auto *nameCol = new QVBoxLayout();
    nameCol->setSpacing(4);

    m_displayNameLabel = new QLabel("...");
    m_displayNameLabel->setStyleSheet("color: " + PRIMARY + "; font-size: 22px; font-weight: bold;");
    nameCol->addWidget(m_displayNameLabel);

    m_usernameLabel = new QLabel("");
    m_usernameLabel->setStyleSheet("color: " + SECONDARY + "; font-size: 14px;");
    nameCol->addWidget(m_usernameLabel);

    m_emailLabel = new QLabel("");
    m_emailLabel->setStyleSheet("color: " + SECONDARY + "; font-size: 13px;");
    nameCol->addWidget(m_emailLabel);

    nameCol->addStretch();
    topRow->addLayout(nameCol);
    topRow->addStretch();

    infoLayout->addLayout(topRow);

    m_rolesContainer = new QWidget();
    auto *rolesLayout = new QHBoxLayout(m_rolesContainer);
    rolesLayout->setContentsMargins(0, 0, 0, 0);
    rolesLayout->setSpacing(8);
    rolesLayout->addStretch();
    infoLayout->addWidget(m_rolesContainer);

    infoLayout->addStretch();
    m_mainLayout->addWidget(infoCard);

    m_profileSection = new QWidget();
    auto *profileLayout = new QVBoxLayout(m_profileSection);
    profileLayout->setContentsMargins(0, 0, 0, 0);
    profileLayout->setSpacing(8);
    m_mainLayout->addWidget(m_profileSection);

    m_eloSection = new QWidget();
    auto *eloLayout = new QVBoxLayout(m_eloSection);
    eloLayout->setContentsMargins(0, 0, 0, 0);
    eloLayout->setSpacing(8);

    auto *eloHeading = new QLabel("ELO REITING");
    eloHeading->setStyleSheet("color: " + PRIMARY + "; font-size: 14px; font-weight: bold;");
    eloLayout->addWidget(eloHeading);

    m_eloCard = new QFrame();
    m_eloCard->setStyleSheet(
        "QFrame { background: " + BG + "; border: 1px solid " + BORDER + "; border-radius: 8px; padding: 16px; }"
    );
    auto *eloInner = new QHBoxLayout(m_eloCard);
    eloInner->setSpacing(32);

    auto makeStat = [&](const QString &title, QLabel *&valueLabel) {
        auto *col = new QVBoxLayout();
        col->setSpacing(4);
        auto *titleLbl = new QLabel(title);
        titleLbl->setStyleSheet("color: " + SECONDARY + "; font-size: 12px;");
        titleLbl->setAlignment(Qt::AlignCenter);
        col->addWidget(titleLbl);
        valueLabel = new QLabel("--");
        valueLabel->setStyleSheet("color: " + PRIMARY + "; font-size: 28px; font-weight: bold;");
        valueLabel->setAlignment(Qt::AlignCenter);
        col->addWidget(valueLabel);
        return col;
    };

    eloInner->addLayout(makeStat("ELO", m_eloValue));
    eloInner->addLayout(makeStat("POBEDY", m_winsValue));
    eloInner->addLayout(makeStat("PORAZHENIYA", m_lossesValue));
    eloLayout->addWidget(m_eloCard);

    eloLayout->addStretch();
    m_mainLayout->addWidget(m_eloSection);

    m_logoutButton = new QPushButton("Vojti");
    m_logoutButton->setStyleSheet(
        "QPushButton { background: transparent; color: #ff4444; border: 1px solid #ff4444; border-radius: 6px; padding: 10px 24px; font-size: 13px; font-weight: bold; }"
        "QPushButton:hover { background: #ff4444; color: #fff; }"
    );
    m_logoutButton->setFixedWidth(160);
    connect(m_logoutButton, &QPushButton::clicked, []() {
        Application::instance()->authManager()->logout();
    });
    m_mainLayout->addWidget(m_logoutButton, 0, Qt::AlignLeft);

    m_mainLayout->addStretch();

    m_scroll->setWidget(m_content);

    auto *outer = new QVBoxLayout(this);
    outer->setContentsMargins(0, 0, 0, 0);
    outer->addWidget(m_scroll);
}

bool ProfilePage::isOwnProfile(int userId) const
{
    QJsonObject me = Application::instance()->authManager()->user();
    return me["id"].toInt() == userId;
}

void ProfilePage::loadProfile(int userId)
{
    QString path = QString("/api/users/%1").arg(userId);
    Application::instance()->httpClient()->get(path,
        [this](const QJsonObject &user) {
            renderProfile(user);
            loadElo(user["id"].toInt());
        },
        [this](const QString &err) {
            m_mainLayout->addWidget(new QLabel("Oshibka: " + err));
        }
    );
}

void ProfilePage::renderProfile(const QJsonObject &user)
{
    QString displayName = user["displayName"].toString();
    QString username = user["username"].toString();
    QString email = user["email"].toString();
    QString avatar = user["avatar"].toString();
    QString initial = displayName.left(1).toUpper();
    if (initial.isEmpty()) initial = username.left(1).toUpper();

    if (!avatar.isEmpty()) {
        m_avatarLabel->setText("");
    } else {
        m_avatarLabel->setText(initial);
    }

    m_displayNameLabel->setText(displayName);
    m_usernameLabel->setText("@" + username);
    m_emailLabel->setText(email);

    QLayoutItem *oldRole;
    while ((oldRole = m_rolesContainer->layout()->takeAt(0)) != nullptr) {
        if (oldRole->widget()) oldRole->widget()->deleteLater();
        delete oldRole;
    }

    QJsonArray roles = user["roles"].toArray();
    for (const auto &r : roles) {
        QJsonObject role = r.toObject();
        QString roleName = role["name"].toString();
        QString color = role["color"].toString("#888");

        auto *badge = new QLabel(roleName);
        badge->setStyleSheet(
            QString("background: %1; color: #fff; border-radius: 12px; padding: 4px 12px; font-size: 11px; font-weight: bold;")
                .arg(color)
        );
        m_rolesContainer->layout()->addWidget(badge);
    }
    m_rolesContainer->layout()->addWidget(new QWidget());
    qobject_cast<QHBoxLayout *>(m_rolesContainer->layout())->addStretch();

    QLayoutItem *oldProfile;
    while ((oldProfile = m_profileSection->layout()->takeAt(0)) != nullptr) {
        if (oldProfile->widget()) oldProfile->widget()->deleteLater();
        delete oldProfile;
    }

    QJsonObject profile = user["profile"].toObject();
    struct Field { QString label; QString value; };
    QList<Field> fields;
    fields << Field{"Discord", profile["discord"].toString()};
    fields << Field{"Steam", profile["steam"].toString()};
    fields << Field{"EA", profile["ea"].toString()};
    fields << Field{"Battle.net", profile["battleNet"].toString()};
    fields << Field{"Strana", profile["country"].toString()};
    fields << Field{"Bio", profile["bio"].toString()};

    auto *profileCard = new QFrame();
    profileCard->setStyleSheet(
        "QFrame { background: " + BG + "; border: 1px solid " + BORDER + "; border-radius: 8px; padding: 16px; }"
    );
    auto *pLayout = new QVBoxLayout(profileCard);
    pLayout->setSpacing(10);

    auto *profTitle = new QLabel("PROFIL");
    profTitle->setStyleSheet("color: " + PRIMARY + "; font-size: 14px; font-weight: bold;");
    pLayout->addWidget(profTitle);

    bool hasAnyField = false;
    for (const auto &f : fields) {
        if (f.value.isEmpty()) continue;
        hasAnyField = true;
        auto *row = new QHBoxLayout();
        auto *lbl = new QLabel(f.label + ":");
        lbl->setStyleSheet("color: " + SECONDARY + "; font-size: 13px; font-weight: bold;");
        lbl->setFixedWidth(100);
        row->addWidget(lbl);
        auto *val = new QLabel(f.value);
        val->setStyleSheet("color: " + PRIMARY + "; font-size: 13px;");
        row->addWidget(val);
        row->addStretch();
        pLayout->addLayout(row);
    }

    if (!hasAnyField) {
        auto *noData = new QLabel("Net dannyh profilya");
        noData->setStyleSheet("color: " + SECONDARY + "; font-size: 13px; font-style: italic;");
        pLayout->addWidget(noData);
    }

    m_mainLayout->insertWidget(2, profileCard);

    m_logoutButton->setVisible(isOwnProfile(user["id"].toInt()));
}

void ProfilePage::loadElo(int userId)
{
    QString path = QString("/api/elo/%1").arg(userId);
    Application::instance()->httpClient()->get(path,
        [this](const QJsonObject &data) {
            renderElo(data);
        },
        [this](const QString &) {
            m_eloValue->setText("N/A");
            m_winsValue->setText("0");
            m_lossesValue->setText("0");
        }
    );
}

void ProfilePage::renderElo(const QJsonObject &data)
{
    int elo = data["elo"].toInt();
    int wins = data["wins"].toInt();
    int losses = data["losses"].toInt();

    QString eloColor;
    if (elo > 1200) eloColor = "#4caf50";
    else if (elo >= 1000) eloColor = "#ffeb3b";
    else eloColor = "#ff4444";

    m_eloValue->setText(QString::number(elo));
    m_eloValue->setStyleSheet(QString("color: %1; font-size: 28px; font-weight: bold;").arg(eloColor));
    m_winsValue->setText(QString::number(wins));
    m_lossesValue->setText(QString::number(losses));
}
