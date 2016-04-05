<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<title>Connect Globe</title>
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
		<div id="bg_img">
			<div id="site_div">			
				<div id="header">
					<div id="logo">
						<img src="images/page1-img3.png" align="left"></img>
						<br/>
						<div>
						<%
							if(session.getAttribute("username")!=null){
							out.print("<p align='right'><font size='3' color='white'><b> Hello,"+(String)session.getAttribute("username")+"</b></font></p>");					
							out.print("<form action='logout.jsp'>");
							out.print("<input type='submit' align='left' value='Logout' id='login-submit'/>");
							out.print("</form>");					
							}
						%>
						</div>		
						<br/><span><font style="color:maroon" size="32"><b>Connect Globe</b></font></span>
					</div>
					<div id="menu">
						<ul>
							<li><a href="home.jsp">Home</a></li>							
							<li><a href="post.jsp">Post Report</a></li>
							<li><a href="status.jsp">View Report</a></li>
							<li><a href="area.jsp">Search Report</a></li>
							<li><a href="register.jsp">Register</a></li>
						</ul>
					</div>
					<div style="clear: both;"></div>
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
						</div>
					</div>					
				</div>
			</div>
		</body>		
	</html>