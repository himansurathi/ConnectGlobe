<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<%@page import="org.omg.CORBA.PUBLIC_MEMBER"%>
<%@page import="java.sql.*"%>
<%@page import="java.util.*"%>
<%@page import="com.javatpoint.Constants" %>
<%
	String username=request.getParameter("username");
	System.out.println("Trying To Log in : "+username+"\n");
	String userpass=request.getParameter("userpass");
	
	
	boolean status=false;
	try{
	Class.forName(Constants.DRIVER_NAME);
	Connection con =DriverManager.getConnection(Constants.DB_URL,Constants.DB_USERNAME,Constants.DB_PASSWORD);
	PreparedStatement ps=con.prepareStatement("select * from forumreg where username=? and userpass=? ");
	ps.setString(1,username);
	ps.setString(2,userpass);
	ResultSet rs=ps.executeQuery();
	status=rs.next();
	if(status){
	username=rs.getString(2);
	String email=rs.getString(4);
	System.out.println("Login Succesful!!!! Hello "+email);
	session.setAttribute("email",email); 
	session.setAttribute("username",username);
	session.setAttribute("islogin","plz sign in first");
	
%>
<jsp:forward page="postsmade.jsp"></jsp:forward>
<%
	}
	else{
	System.out.print("Login Not succesful!!!! Sorry \n");
	request.setAttribute("Error","Sorry! Username or Password Error.");
	session.setAttribute("Loginmsg","plz sign in first");
%>
<jsp:forward page="index.jsp"></jsp:forward>
<%
	}
	}
	
	catch(Exception e){
	e.printStackTrace();
	}
%>


