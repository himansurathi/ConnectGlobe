<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<%@ page import="java.sql.*" %>
<%@ page import="com.javatpoint.Constants" %>

<%
String n=request.getParameter("val");
System.out.println(n);
if(n.length()>0){
try{
	Class.forName(Constants.DRIVER_NAME);
	Connection con =DriverManager.getConnection(Constants.DB_URL,Constants.DB_USERNAME,Constants.DB_PASSWORD);

PreparedStatement ps=con.prepareStatement("select userpass from forumreg where email ='"+n+"'");
//ps.setString(1,n);
out.print("<br>");
ResultSet rs=ps.executeQuery();
if(rs.next()){
String email=rs.getString(1);
out.print("<font style='color:green;' size='3'>Your Password is:  "+email+"</font>");
out.print("<br/><br/><a href='index.jsp'><font style='color:maroon;' size='3'>Login Again</font></a>");

}
con.close();
}catch(Exception e){e.printStackTrace();}
}//end of if
%>