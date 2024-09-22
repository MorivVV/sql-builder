"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromTables = void 0;
const BasicQuery_1 = require("./BasicQuery");
const globalSetting_1 = require("../config/globalSetting");
class FromTables extends BasicQuery_1.BasicQuery {
    constructor(tables, valNum = 0, token, userId) {
        super(valNum, token, userId);
        this.tables = [];
        for (let index = 0; index < tables.length; index++) {
            const table = tables[index];
            let pTable;
            let alias = "at" + index;
            const use = false;
            if (typeof table === "string") {
                // вытаскиваем значения из функции
                ({ pTable, alias } = this.stringTable(table, index));
            }
            else {
                ({ pTable, alias } = this._subQuery(table));
            }
            this.tables.push(Object.assign(Object.assign({}, pTable), { alias, use }));
            if (index === 0)
                this.queryString = "FROM ";
        }
    }
    stringTable(strTable, ind = 0) {
        const sp = strTable.split(":");
        const table = sp[0];
        let alias = "at" + ind;
        if (sp.length === 2) {
            alias = sp[1];
        }
        const pTable = this.splitTable(table);
        pTable.table = pTable.scheme + "." + pTable.table;
        if (this.needCheckAccess(table)) {
            pTable.table = this.addAccess(pTable.table);
        }
        return { pTable, alias };
    }
    _subQuery(t) {
        const cSelect = super.subQuery(t);
        let alias = "t0";
        const pTable = {
            table: "(" + cSelect + ")",
        };
        if ("alias" in t && t.alias) {
            alias = t.alias;
        }
        else {
            alias = "t" + this.valNum;
        }
        return { pTable, alias };
    }
    addAccess(table) {
        return `(${this.allowTableData(table)}
     )`;
    }
    checkAccess(table) {
        return `SELECT DISTINCT re.kod_role, re.kod_table, $1 
      FROM ${globalSetting_1.defaultSchema}.rights_elements as re
        INNER JOIN ${globalSetting_1.defaultSchema}.rights_table as rt ON re.kod_table = rt.id 
        INNER JOIN ${globalSetting_1.defaultSchema}.roles as r ON re.kod_role = r.id 
        INNER JOIN ${globalSetting_1.defaultSchema}.roles_users as ru ON r.id = ru.kod_role 
        INNER JOIN ${globalSetting_1.defaultSchema}.bz_users as u ON ru.kod_user = u.id
        INNER JOIN ${globalSetting_1.defaultSchema}.bz_user_tokens as ut ON u.id = ut.kod_user
      WHERE rt.naimen = '${table}'
        AND ut.session_token = '${this.token}'
        and ru.access_level >= 10
        AND u.active = true
        AND ut.active = true
    ) )`;
    }
}
exports.FromTables = FromTables;
