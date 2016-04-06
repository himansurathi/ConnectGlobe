<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="ISO-8859-1"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Connect Globe</title>
<link href="style.css" rel="stylesheet" type="text/css" /> 
</head>
<jsp:include page="header.jsp"></jsp:include>
<body>
<body>
	<div id="bg_img">
		<div id="site_div">		
			<div id="main">
				<div class="main_bg">
					<div id="index_box_bot"></div>
					<br/>
					<div id="index_col3">
						<img src="images/contact.png" alt="" title="" style="float: left; padding-right: 10px; padding-bottom: 4px;" />
						<h4>Search By</h4>
						<br /><br />
						<a href="area.jsp"><button>Search by Location</button></a>
						<br/>
						<br/>
						<a href="topic.jsp"><button>Search by Topic</button></a>
						<br/>
					</div>
					<div style="clear: both"></div>
				</div>
			</div>
		</div>
		<div class="main_bot"></div>						
	</div>
</body>
<jsp:include page="footer.html"></jsp:include>
</html>