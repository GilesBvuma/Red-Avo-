import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DropDb {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/Red_Avo";
        try (Connection conn = DriverManager.getConnection(url, "postgres", "T@diwanashe17");
             Statement stmt = conn.createStatement()) {
            stmt.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
            System.out.println("Schema dropped and recreated.");
        }
    }
}
