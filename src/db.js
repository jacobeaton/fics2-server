import sql from "mssql"
import { connectionSettings } from "./config/config"

class DB {
  constructor() {
    this.initDb()
  }

  async initDb() {
    try {
      this.db = await new sql.ConnectionPool(connectionSettings).connect()
    } catch (error) {
      console.log(error)
    }
  }
}

const SageX3 = new DB()

export default SageX3
