<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<title>Test</title>
	<meta name="keywords" content="" />
	<meta name="description" content="" />
	<link href="styles.css" rel="stylesheet" type="text/css" media="screen" />
		<script type="text/javascript" src="lib/jquery-1.3.2.min.js"></script>
		<script type="text/javascript" src="lib/jquery.easing.1.3.js"></script>
		<script type="text/javascript" src="lib/jquery.coda-slider-2.0.js"></script>
	<!-- Initialize each slider on the page. Each slider must have a unique id -->
		<script type="text/javascript">
		$().ready(function() {
		$('#coda-slider-2').codaSlider({
			autoSlide: true,
			autoSlideInterval: 6000,
			autoSlideStopWhenClicked: true	
				
		});
	 });
	</script>
	
	<script type="text/javascript" src="lib/pirobox.js"></script>
	<script type="text/javascript">
		$(document).ready(function() {
			$().piroBox({
					my_speed: 400, //animation speed
					bg_alpha: 0.1, //background opacity
					slideShow : false, // true == slideshow on, false == slideshow off
					slideSpeed : 4, //slideshow duration in seconds(3 to 6 Recommended)
					close_all : '.piro_close,.piro_overlay'// add class .piro_overlay(with comma)if you want overlay click close piroBox
		
			});
		});
	</script>
	<link href="style.css" rel="stylesheet" type="text/css" /> 
</head>


<body>
<%session.invalidate(); %>
		<div id="bg_img">
			<div id="site_div">
			
				<div id="header">
					<div id="logo">
						<img src="images/page1-img3.png" align="left"></img>
						<br/>
						<br/><span><font style="color:maroon" size="32"><b>Connect Globe</b></font></span>
					</div>
					<div id="menu">
						<ul>
							<li><a href="#">Home</a></li>							
							<li><a href="post.jsp">Post Report</a></li>
							<li><a href="status.jsp">View Status</a></li>
							<li><a href="area.jsp">Your Area</a></li>
							<li><a href="advice.jsp">Your Advice</a></li>
							<li><a href="discuss.jsp">Discuss</a></li>
							<li><a href="register.jsp">Register</a></li>
							<li><a href="admin.jsp">Admin</a></li>
						</ul>
					</div>
					<div style="clear: both;"></div>
				</div>
				
				<div class="inner_copy">
					<div class="inner_copy">Best selection of premium 
						<a href="http://www.templatemonster.com/pack/joomla-1-6-templates/">Joomla 1.6 templates</a>
					</div>
				</div>
				
					<div id="main">
						<div class="index_main_top">
						</div>
						<div class="main_bg">
							<div class="index_prev_grad">
								<div class="coda-slider-wrapper">
									<div class="coda-slider preload" id="coda-slider-2">
										<div class="panel">
											<div class="panel-wrapper">
												<div class="prev_but_center">
													<div class="prev_but_center_left">
														<div class="prev_img"><img src="images/pic-01.jpg" alt="" title=""/>
														</div>
													</div>
													<div class="prev_but_center_right">
														<p><a href="#">Sample News  </a><br/>
															Sample News Details</p> <br/><br/>

														<p><a href="#">Sample News </a><br/>
															Sample News Details</p> <br/><br/>
													</div>
												</div>	
											</div>
										</div>
										<div class="panel">
											<div class="panel-wrapper">
												<div class="prev_but_center">
													<div class="prev_but_center_left">
														<div class="prev_img"><img src="images/header_scroll.jpg" alt="" title=""/>
														</div>
													</div>
													<div class="prev_but_center_right">
														<p><a href="#">Sample News </a><br/>
															Sample News Details</p> <br/><br/>

														<p><a href="#"> Sample News </a><br/>
															Sample News Details</p> <br/><br/>
													</div>
												</div>
											</div>
										</div>	
										<div class="panel">
											<div class="panel-wrapper">									
												<div class="prev_but_center">
													<div class="prev_but_center_left">
														<div class="prev_img"><img src="images/header_scroll2.jpg" alt="" title=""/>
														</div>
													</div>
													<div class="prev_but_center_right">
														<p><a href="#">Sample News  </a><br/>
															Sample News Details</p> <br/><br/>
														
														<p><a href="#">Sample News </a><br/>
															Sample News Details</p> <br/><br/>														
													</div>
												</div>											
											</div>
										</div>
										<div class="panel">
											<div class="panel-wrapper">
												<div class="prev_but_center">
													<div class="prev_but_center_left">
														<div class="prev_img"><img src="images/header_scroll3.jpg" alt="" title=""/></div>
													</div>
													<div class="prev_but_center_right">
														<p><a href="#">Sample News </a><br/>
															Sample News Details </p> <br/><br/>
														<p><a href="#">Sample News </a><br/>
															Sample News Details</p> <br/><br/>
																							
													</div>
												</div>
											</div>
										</div>
				
									</div><!-- .coda-slider -->
								</div>
							</div>					
							<div class="index_prev_bot"></div>
	
							<div id="index_box">
								<div id="index_box_top"></div>
								<div id="index_box_bg">
									<h3>Now You can Share Your Social Problem such as some kind of Harassment,Bribe matters.</h3>
									<p>Simply just Register Yourself and Do login After that click on Post Report Link as shown above.And After selecting Your subject and location YOu can post Your matter Simply .This will be visible to every visitors and our Supporters will try to proceed it further</p>
									
								</div>
								<div id="index_box_bot"></div>
							</div>
	
	
						<div id="index_col">
							<img src="images/contact.png" alt="" title="" style="float: left; padding-right: 10px; padding-bottom: 4px;" />
							<h4>Login Form</h4>
							<div id="log">
					
							 <% 
								if(request.getAttribute("notlogin_msg")!=null){
								out.print("<font size='2' color='red' style='text-align:center'>");
								out.print(request.getAttribute("notlogin_msg"));
								out.print("</font>");
								}
								if(request.getAttribute("Error")!=null){
								out.print("<font size='2' color='red' style='text-align:center'>");
								out.print(request.getAttribute("Error"));
								out.print("</font>");
								}
								if(request.getAttribute("reg")!=null){
									out.print("<font style='color:red'>"+request.getAttribute("reg")+"</font>");
									
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
					<div style="clear: both">
					</div>
				</div>
			</div>
			<div class="main_bot"></div>
		</div>
	</div>
</body>


<jsp:include page="footer.html"></jsp:include>
</html>