<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<%@ page import="java.sql.*" %>
<%@ page import="com.javatpoint.Constants" %>

<%
String n=request.getParameter("id");
System.out.println(n);

try{
    Class.forName(Constants.DRIVER_NAME);       
	Connection con=DriverManager.getConnection(Constants.DB_URL,Constants.DB_USERNAME,Constants.DB_PASSWORD);
System.out.print(n);
PreparedStatement ps=con.prepareStatement("delete from forumrep where id='"+n+"'");
//ps.setString(1,n);
out.print("<br>");
int rs=ps.executeUpdate();

ps=con.prepareStatement("delete from forumadvc where rid='"+n+"'");
ps.executeUpdate();

con.close();
%>

<jsp:forward page="astatus.jsp"></jsp:forward>
<% 
}catch(Exception e){e.printStackTrace();}
%>
