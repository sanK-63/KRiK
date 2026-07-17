#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;
class QGridLayout;

class CinemaPage : public QWidget
{
    Q_OBJECT

public:
    explicit CinemaPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadMovies();
    void renderMovies(const QJsonArray &movies);
    void showMovieDialog(const QJsonObject &movie);

    QVBoxLayout *m_mainLayout = nullptr;
    QGridLayout *m_gridLayout = nullptr;
    QWidget *m_gridContainer = nullptr;
    QLabel *m_loadingLabel = nullptr;
};
