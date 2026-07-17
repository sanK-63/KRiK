#pragma once

#include <QWidget>
#include <QJsonArray>
#include <QJsonObject>
#include <QMap>

class QStackedWidget;
class QScrollArea;
class QVBoxLayout;
class QHBoxLayout;
class QGridLayout;
class QLabel;
class QPushButton;
class QLineEdit;
class QTextEdit;
class QComboBox;
class QFrame;
class QTimer;

class TournamentPage : public QWidget
{
    Q_OBJECT

public:
    explicit TournamentPage(QWidget *parent = nullptr);

    void refresh();

private:
    void setupUi();
    void setupListView();
    void setupDetailView();
    void setupCreateView();

    void loadTournaments();
    void populateTournamentGrid(const QJsonArray &tournaments);

    void showDetail(int tournamentId);
    void loadTournamentDetail(int id);
    void populateDetail(const QJsonObject &tournament);

    void loadRegistrations(int tournamentId);
    void populateRegistrations(const QJsonArray &registrations);

    void loadBracket(int tournamentId);
    void populateBracket(const QJsonArray &rounds);

    void approveRegistration(int tournamentId, int registrationId);
    void rejectRegistration(int tournamentId, int registrationId);

    void updateMatchScore(int tournamentId, int matchId, int score1, int score2);

    void advanceStatus(int tournamentId, const QString &newStatus);

    void loadGames();
    void createTournament();

    QString statusColor(const QString &status) const;
    QString statusLabel(const QString &status) const;
    QString nextStatus(const QString &current) const;

    QStackedWidget *m_stack = nullptr;

    QScrollArea *m_listScroll = nullptr;
    QWidget *m_listContent = nullptr;
    QVBoxLayout *m_listLayout = nullptr;
    QGridLayout *m_tournamentGrid = nullptr;

    QWidget *m_detailContent = nullptr;
    QVBoxLayout *m_detailLayout = nullptr;
    QLabel *m_detailTitle = nullptr;
    QLabel *m_detailStatus = nullptr;
    QLabel *m_detailGame = nullptr;
    QLabel *m_detailDescription = nullptr;
    QLabel *m_detailFormat = nullptr;
    QLabel *m_detailDates = nullptr;
    QLabel *m_detailRules = nullptr;
    QWidget *m_registrationsContainer = nullptr;
    QVBoxLayout *m_registrationsLayout = nullptr;
    QWidget *m_bracketContainer = nullptr;
    QVBoxLayout *m_bracketLayout = nullptr;

    QWidget *m_createContent = nullptr;
    QVBoxLayout *m_createLayout = nullptr;
    QComboBox *m_gameCombo = nullptr;
    QLineEdit *m_titleEdit = nullptr;
    QTextEdit *m_descEdit = nullptr;
    QComboBox *m_formatCombo = nullptr;
    QPushButton *m_createBtn = nullptr;

    int m_selectedTournamentId = -1;
    QJsonArray m_games;
};
