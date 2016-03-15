<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<%@ page import="java.sql.*" %>
<%@ page import="com.javatpoint.Constants"%>

<%
String n=request.getParameter("val");
System.out.println(n);
if(n.length()>0){
try{
	Class.forName(Constants.DRIVER_NAME);
	Connection con =DriverManager.getConnection(Constants.DB_URL,Constants.DB_USERNAME,Constants.DB_PASSWORD);

PreparedStatement ps=con.prepareStatement("select * from forumreg where email ='"+n+"'");
//ps.setString(1,n);
out.print("<br>");
ResultSet rs=ps.executeQuery();
if(rs.next()){
out.print("<font style='color:red'>Already Exist</font>");
}



con.close();
}catch(Exception e){e.printStackTrace();}
}//end of if
%>