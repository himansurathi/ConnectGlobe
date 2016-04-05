<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<title>Connect Globe</title>
	<link href="style.css" rel="stylesheet" type="text/css" /> 
</head>

<jsp:include page="header.jsp"></jsp:include>

<body>
<%session.invalidate(); %>
	<div id="bg_img">
		<div id="site_div">		
			<div id="main">
				<div class="main_bg">
					<div class="index_prev_bot"></div>
					<div id="index_box">
						<div id="index_box_top"></div>
						<div id="index_box_bg">
							<h3 align="center">Now You can Share Your Social Problem such as some kind of Harassment,Bribe matters.</h3><br/>
							<p><b>Simply just Register Yourself and Do login After that click on Post Report Link as shown above.And After selecting your subject and location you can post your matter simply .This will be visible to every visitors and our Supporters will try to proceed it further</b></p>
						</div>
						<div id="index_box_bot"></div>
					</div>
					
					<div id="index_col">
						<img src="images/contact.png" alt="" title="" style="float: left; padding-right: 10px; padding-bottom: 4px;" />
						<h4>Login Form</h4>
						<div id="log">
				
							 <% 
								if(request.getAttribute("notlogin_msg")!=null){
								out.print("<p align='center'><font size='2' color='red'>"+request.getAttribute("notlogin_msg")+"</font></p><br/>");
								}
								if(request.getAttribute("Error")!=null){
								out.print("<p align='center'><font size='2' color='red'>"+request.getAttribute("Error")+"</font></p><br/>");
								}
								if(request.getAttribute("reg")!=null){
									out.print("<p align='center'><font style='color:red'>"+request.getAttribute("reg")+"</font></p><br/>");
								
								} 
							%>
									
							<form id="form1" method="post" action="loginprocess.jsp">
								<fieldset>
									User Name:<input id="text1" type="text" name="username" style="margin-left:35%; text-align:center"/><br/><br/>
									Password:<input id="text2" type="password" name="userpass" style="margin-left:36%; text-align:center"/><br/><br/>
									<input type="submit" id="login-submit" value="Login" style="margin-right:35%; text-align:center"/>
									<div class="foot_pad">
										<ul class="ls">
											<li style="margin-left:20%;"><a href="register.jsp" >New User</a></li>
											<li style="margin-left:20%;"><a href="forgot.jsp">Forgot Password</a></li>	
											<li style="margin-left:20%;"><a href="admin.jsp">Administrator Login</a></li>
										</ul>
									</div>
								</fieldset>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div style="clear: both"></div>
		<div class="main_bot"></div>
	</div>
</body>


<jsp:include page="footer.html"></jsp:include>
</html>