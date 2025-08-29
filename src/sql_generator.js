const fs = require("fs");
const { config } = require("./config");

function generateSqlInsert(data, schema) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data array must be a non-empty array.");
  }

  const columnsList = extractColumnsAsList(schema.columns),
    statements = [],
    tableName = schema.table_name;

  for (let i = 0; i < data.length; i += config.BATCH_SIZE_INSERT_SQL) {
    const batchData = data.slice(i, i + config.BATCH_SIZE_INSERT_SQL);
    const valueSets = batchData.map((obj) => {
      const values = Object.entries(obj)
        .filter(([key]) => !key.startsWith("_"))
        .map(([key, value]) => {
          if (typeof value === "string") {
            value = value.replace(/'/g, "''");
            return `'${value}'`;
          }
          return value;
        });
      return `(${values.join(", ")})\n`;
    });

    const sql = `INSERT INTO ${tableName} (${columnsList.join(", ")})\n VALUES ${valueSets.join(", ")};`;
    statements.push(sql);
  }

  return statements;
}

function generateDropTableSql(table) {
  return `DROP TABLE IF EXISTS ${table.table_name};\n`;
}

function generateTableSql(table) {
  let sql = `CREATE TABLE ${table.table_name} (\n`;

  for (const column of table.columns) {
    sql += `  ${column.name} ${column.type}`;

    if (!column.nullable) {
      sql += " NOT NULL";
    }

    if (column.primary_key) {
      sql += " PRIMARY KEY";
    }

    if (column.auto_increment) {
      sql += " AUTO_INCREMENT";
    }

    if (column.foreign_key) {
      const { table: refTable, column: refColumn } = column.foreign_key;
      sql += ` REFERENCES ${refTable}(${refColumn})`;
    }

    sql += ",\n";
  }

  sql = sql.slice(0, -2);
  sql += "\n);\n\n";

  return sql;
}

function generateSchemaSql(schema) {
  let sql = "SET FOREIGN_KEY_CHECKS = 0;\nSTART TRANSACTION;\n\n";

  sql += generateDropTableSql(schema.events);
  sql += generateDropTableSql(schema.cases);

  if (schema.data) {
    for (const table of schema.data) {
      sql += generateDropTableSql(table);
    }
  }

  sql += "\n";

  if (schema.data) {
    for (const table of schema.data) {
      sql += generateTableSql(table);
    }
  }

  sql += generateTableSql(schema.cases);
  sql += generateTableSql(schema.events);
  sql += "SET FOREIGN_KEY_CHECKS = 1;\nCOMMIT;";

  return sql;
}

function extractColumnsAsList(columns) {
  const list = [];

  for (const column of columns) {
    list.push(column.name);
  }

  return list;
}

function columnsFromMap(columnsMap, displayNames) {
  const columns = [];

  for (const key of displayNames) {
    if (key.startsWith("_")) continue;

    const value = columnsMap[key];
    columns.push(value);
  }

  return columns;
}

module.exports = { generateSchemaSql, generateSqlInsert };
