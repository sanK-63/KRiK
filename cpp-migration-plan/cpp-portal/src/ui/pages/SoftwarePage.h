#pragma once

#include <QWidget>
#include <QJsonArray>

class QLabel;
class QVBoxLayout;
class QGridLayout;

class SoftwarePage : public QWidget
{
    Q_OBJECT

public:
    explicit SoftwarePage(QWidget *parent = nullptr);

private:
    void setupUi();
    void loadSoftware();
    void renderSoftware(const QJsonArray &items);
    QWidget *createSoftwareCard(const QJsonObject &item);
    void showAddEditDialog(const QJsonObject &existing);

    QVBoxLayout *m_mainLayout = nullptr;
    QGridLayout *m_gridLayout = nullptr;
    QWidget *m_gridContainer = nullptr;
    QLabel *m_loadingLabel = nullptr;
    bool m_isAdmin = false;
};
