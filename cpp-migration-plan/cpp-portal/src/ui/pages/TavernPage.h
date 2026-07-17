#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;
class QHBoxLayout;
class QFrame;

class TavernPage : public QWidget
{
    Q_OBJECT

public:
    explicit TavernPage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadRecipes();
    void renderRecipes(const QJsonArray &recipes);
    void filterByCategory(const QString &category);
    void showRecipeDialog(const QJsonObject &recipe);

    QVBoxLayout *m_mainLayout = nullptr;
    QHBoxLayout *m_tabsLayout = nullptr;
    QVBoxLayout *m_cardsLayout = nullptr;
    QWidget *m_cardsContainer = nullptr;
    QLabel *m_loadingLabel = nullptr;
    QJsonArray m_recipes;
    QString m_activeFilter;
};
