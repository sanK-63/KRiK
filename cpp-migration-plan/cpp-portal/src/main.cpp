#include <QApplication>
#include <QFont>
#include <QFile>
#include "core/Application.h"
#include "core/Logger.h"
#include "core/Config.h"
#include "core/DatabaseManager.h"

int main(int argc, char *argv[])
{
    QApplication qtApp(argc, argv);
    qtApp.setApplicationName("Corporate Portal");
    qtApp.setOrganizationName("RogaKopyta");
    qtApp.setApplicationVersion("1.0.0");

    QFont defaultFont("Segoe UI", 10);
    qtApp.setFont(defaultFont);

    Logger::instance().init();
    Logger::instance().info("Application starting...");

    Config::instance().load();

    QString dbPath = Config::instance().value("database/path", "portal.db").toString();
    DatabaseManager::instance().init(dbPath);

    Application app;
    app.start();

    int result = qtApp.exec();

    app.shutdown();
    DatabaseManager::instance().close();
    Logger::instance().info("Application shut down.");
    return result;
}
