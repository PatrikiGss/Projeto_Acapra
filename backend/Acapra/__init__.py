# Registra o PyMySQL como driver MySQLdb antes de o Django carregar o backend de
# banco. Em hospedagem compartilhada (cPanel) o mysqlclient costuma falhar de
# compilar; o PyMySQL é Python puro e funciona sem toolchain. Inócuo quando o
# banco é SQLite (PyMySQL só é usado pelo ENGINE django.db.backends.mysql).
try:
    import pymysql

    pymysql.install_as_MySQLdb()
except ImportError:
    # PyMySQL ausente (ex.: ambiente local em SQLite sem a dependência): segue
    # normalmente — só é necessário quando o ENGINE é MySQL.
    pass
