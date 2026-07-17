#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;
class QGridLayout;

class MemesPage : public QWidget
{
    Q_OBJECT

public:
    explicit MemesPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadMemes();
    void renderMemes(const QJsonArray &memes);
    void likeMeme(const QString &id, QLabel *likesLabel);
    void showCreateDialog();
    QWidget *createMemeCard(const QJsonObject &meme);

    QVBoxLayout *m_mainLayout = nullptr;
    QGridLayout *m_gridLayout = nullptr;
    QWidget *m_gridContainer = nullptr;
    QLabel *m_loadingLabel = nullptr;
    QJsonArray m_memes;
};
