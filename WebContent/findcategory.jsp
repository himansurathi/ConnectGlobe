<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<%@ page import="java.sql.*" %>
<%@ page import="com.javatpoint.Constants" %>

<%
String category=request.getParameter("category");
if(category.length()>0){
	try{
		Class.forName(Constants.DRIVER_NAME);
		Connection con =DriverManager.getConnection(Constants.DB_URL,Constants.DB_USERNAME,Constants.DB_PASSWORD);
		String query="select * from forumrep where category='"+category+"' order by postedon desc";
		System.out.println(query);
		
		PreparedStatement ps=con.prepareStatement(query);
		//ps.setString(1,n);
		out.print("<br>");
		ResultSet rs=ps.executeQuery();
		int flag=0;
		while(rs.next()){
			out.print("<br/><div id='index_box_top'></div>");
			out.print("<div id='index_box_bg'>");
			if(rs.getString(6)!=null)
				out.print("<B><font style='color:navy' size='2'>Report:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><br/><B>"+rs.getString(6)+"</B><br/>");	
			else
				out.print("<B><font style='color:navy' size='2'>Report:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><br/><B>Blank Report </B><br/>");				
			out.print("<B><font style='color:navy' size='2'>Category:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getString(7)+"</B><br/>");	
			out.print("<B><font style='color:navy' size='2'>Email:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getString(9)+"</B><div style='float: right;'><span><B><font style='color:navy' size='2' >Posted On:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><B>"+rs.getDate(10)+"</B></span></div><br/>");		
			out.print("</div>");
			out.print("<div id='index_box_bot'></div>");
			flag=1;
	}
	if(flag==0){
		out.print("<B><font style='color:navy' size='2'>Report:&nbsp;&nbsp;&nbsp;&nbsp;</font></B><br/><B> No Records Found</B><br/>");	
	}
	con.close();
}catch(Exception e){e.printStackTrace();}
}//end of if
%>