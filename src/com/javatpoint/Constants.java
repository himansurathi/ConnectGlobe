package com.javatpoint;

public class Constants {
 public static final String DRIVER_NAME="oracle.jdbc.driver.OracleDriver";
 public static final String HOSTNAME="localhost";
 public static final int DB_PORT=1521;
 public static final String DB_NAME="xe";
 public static final String DB_URL="jdbc:oracle:thin:@"+HOSTNAME+":"+DB_PORT+":"+DB_NAME;
 public static final String DB_USERNAME="system";
 public static final String DB_PASSWORD="tiger";
}
