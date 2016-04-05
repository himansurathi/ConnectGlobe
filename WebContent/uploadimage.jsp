<%@ page import="java.sql.*"%>
<%@ page import="java.io.*"%>
<%@ page import="java.util.*"%>
<%@ page import="com.javatpoint.Constants" %>
<%
String islogin=(String)session.getAttribute("islogin");
if(islogin==null){
request.setAttribute("notlogin_msg","Sorry!!!!!,You need to  Login first");

%>
<jsp:forward page="index.jsp"></jsp:forward>
<%
}
%>
<div id="bg_img">
	<div id="site_div">		
		<div id="main">
			<div class="main_bg">
				<%
				System.out.println("Trying to Record the Post!!!!");
				java.util.Date sqdate=Calendar.getInstance().getTime();
				java.sql.Date dat =new java.sql.Date(sqdate.getTime());
				String country=request.getParameter("slist1");
				String state=request.getParameter("slist2");
				String district=request.getParameter("slist3");
				String police=request.getParameter("slist4");
				String report=request.getParameter("report");
				String category=request.getParameter("category");
				String email=(String)session.getAttribute("email");
				System.out.println("Country : "+country);
				System.out.println("State : "+state);
				System.out.println("District : "+district);
				System.out.println("Police Station : "+police);
				System.out.println("Report Description :"+report);
				System.out.println("Category Description :"+category);
				System.out.println("Email Id: "+email);
					try{
				Class.forName(Constants.DRIVER_NAME);
				Connection con =DriverManager.getConnection(Constants.DB_URL,Constants.DB_USERNAME,Constants.DB_PASSWORD);
				PreparedStatement ps=con.prepareStatement("select count(id) from forumrep where report= ? and email= ?");
				ps.setString(1,report);
				ps.setString(2,email);
				ResultSet rs=ps.executeQuery();
				rs.next();
				int number=rs.getInt("count(id)");
				System.out.println("Number of Duplicate Posts "+ number);
				if(number>0){
					System.out.println("Post Already Present. Duplicate Post  !!!!!");
				%>
				<jsp:forward page="home.jsp"></jsp:forward>
				<%
				}else{
					ps =con.prepareStatement("insert into forumrep(country,state,district,police_station,report,category,email,postedon)"+"values(?,?,?,?,?,?,?,?)");
					ps.setString(1,country);
					ps.setString(2,state);
					ps.setString(3,district);
					ps.setString(4,police);
					ps.setString(5,report);
					ps.setString(6,category);
					ps.setString(7,email);
					ps.setDate(8,dat);
							
					int s=	ps.executeUpdate();
					if(s>0){
					System.out.println("Post Recorded Succesfully!!!");
				%>
				<jsp:forward page="home.jsp"></jsp:forward>
				
				<%
					}
					else
					{
						System.out.print("Sorry!!!!! Post Could not be Recorded. Please try again");
					}	
				}
				}catch(Exception e){e.printStackTrace();}
				%>
			</div>
		</div>
	</div>
	<div style="clear: both"></div>
	<div class="main_bot"></div>
</div>
