<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<%@page import="java.sql.DriverManager"%>
<%@page import="java.sql.Connection"%>
<%@page import="java.sql.PreparedStatement"%>
<%@page import="java.sql.ResultSet"%>
<%@page import="com.javatpoint.Constants" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<title>Connect Globe</title>
<script type="text/javascript" src="lib/jquery.js"></script>
<link href="style.css" rel="stylesheet" type="text/css" /> 
</head>
<jsp:include page="header.jsp"></jsp:include>

<body>
	<div id="bg_img">
			<div id="site_div">		
				<div id="main">
					<div class="main_bg">
						<div id="index_box_bot"></div>
						<br/>
						<%							
							String id=request.getParameter("id");
							try{
							Class.forName(Constants.DRIVER_NAME);
							Connection con =DriverManager.getConnection(Constants.DB_URL,Constants.DB_USERNAME,Constants.DB_PASSWORD);
							PreparedStatement ps= con.prepareStatement("select country,state,district,police_station,report,category,email,postedon,id from forumrep where id='"+id+"'");
							ResultSet rs=ps.executeQuery();
						
							if(rs.next()){
								out.print("<br/><div id='index_box_top'></div>");
								out.print("<div id='index_box_bg'>");
								
								if(rs.getString(1)!=null)
									out.print("<B><font style='color:navy' size='2'>Country:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getString(1)+"</B><br/>");
								if(rs.getString(2)!=null)
									out.print("<B><font style='color:navy' size='2'>State:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getString(2)+"</B><br/>");	
								if(rs.getString(3)!=null)
									out.print("<B><font style='color:navy' size='2'>District:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getString(3)+"</B><br/>");
								if(rs.getString(4)!=null)
									out.print("<B><font style='color:navy' size='2'>Police Station:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getString(4)+"</B><br/>");
								if(rs.getString(5)!=null)
									out.print("<B><font style='color:navy' size='2'>Report:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><br/><B>"+rs.getString(5)+"</B><br/>");	
								else
									out.print("<B><font style='color:navy' size='2'>Report:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><br/><B>Blank Report !!!!</B><br/>");
								if(rs.getString(6)!=null)
									out.print("<B><font style='color:navy' size='2'>Category:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getString(6)+"</B><br/>");	
								out.print("<B><font style='color:navy' size='2'>Email:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getString(7)+"</B><div style='float: right;'><span><B><font style='color:navy' size='2' >Posted On:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getDate(8)+"</B></span></div><br/>");		

								ps= con.prepareStatement("SELECT max(id) FROM FORUMADVC where rid='"+rs.getString(9)+"' ");
								ResultSet rs3=	ps.executeQuery();
								rs3.next();
								int limit=rs3.getInt(1);
								System.out.println("Max Id of the Advice for the Selected Post "+rs.getString(9)+" is: "+limit);
								PreparedStatement ps1= con.prepareStatement("SELECT * FROM FORUMADVC WHERE id <= '"+limit+"' and rid = '"+rs.getString(9)+"' " );
								ResultSet rs2=	ps1.executeQuery();
								out.print("<br/><a><font style='color:navy' size='2'>Advice:</font></a>");
								while(rs2.next()){
									out.print("<div style='border: 1px solid #000; margin-bottom:2%'>");
									if(rs2.getString(3)!=null)
										out.print("<br/><div style='margin-left: 3%'><font style='color:black' size='2'><B>"+rs2.getString(3)+"</B></font></div>");
									else
										out.print("<br/><div style='margin-left: 3%'><font style='color:black' size='2'><B> Blank Report </B></font></div>");
									if(rs2.getString(4)!=null)
										out.print("<br/><div style='text-align: right'>By:-"+rs2.getString(4));
									out.print("</div></div>");
								}
								out.print("<div id='index_box_bot'></div>");	
							}
						}
						catch(Exception e){e.printStackTrace();
						}			
					%>
				</div>
			</div>
		</div>
		<div class="main_bot"></div>
	</div>
	<br /><br />
</body>

<jsp:include page="footer.html"></jsp:include>