const express = require('express');
const cors = require("cors");
const app = express();
const http = require('http');
const oracledb = require('oracledb');
var nodemailer = require('nodemailer');
const server = http.createServer(app);
const server_port = process.env.port || 3000;

app.use(express.json());
app.use(cors());


//JSON mail whith message body
app.post('/json_mail_message', async (req, res) => {


    let dataBody = req.body;


    var connection = await DBConnect();
    connection.execute(dataBody.sql, [], {outFormat: oracledb.OUT_FORMAT_OBJECT}, async function (user_error, user_result) {
        if (user_error) {
            console.error(user_error.message);
            doRelease(connection);

            res.send('<h1>ERROR</h1>');
        } else {
            let lists_user = user_result.rows;
            let columnTitle = "";

            dataBody.headers.map(item => {
                columnTitle += "<th>" + item + "</th> ";
            });


            let html = "";
            if (dataBody.message)
                html += "<p>" + dataBody.message + "</p><br/>";

            if (dataBody.url && dataBody.ips) {
                if (dataBody.ips.local)
                    html += '<a href="' + dataBody.ips.local + '/' + dataBody.url + '" style="background: #403083;color: white;padding: 15px 25px;display: inline-block;text-decoration: none;font-weight: 600; text-align: center;">\n' +
                        '<p style="margin: 0;">CLICK HERE</p>\n' +
                        '<p style="margin: 4px 0 0;font-size: 11px;color: #ffffffe0;text-transform: uppercase;">When  local</p>\n' +
                        '</a>';
                if (dataBody.ips.real)
                    html += '<a href="' + dataBody.ips.real + '/' + dataBody.url + '" style="background: #308346;color: white;padding: 15px 25px;display: inline-block;text-decoration: none;font-weight: 600; text-align: center;">\n' + '<p style="margin: 0;">CLICK HERE</p>\n' +
                        '<p style="margin: 4px 0 0;font-size: 11px;color: #ffffffe0;text-transform: uppercase;">When not local</p>\n' +
                        '</a><br/>';
            } else if (dataBody.url)
                html += '<a href="' + dataBody.url + '" style="background: #403083;color: white;padding: 15px 25px;display: inline-block;text-decoration: none;font-weight: 600; text-align: center;">CLICK HERE</a>';

            html += "<table border=\"1\" width=\"100%\"><tr>" + columnTitle + "</tr>";
            lists_user.map((item) => {

                let rowName = "<tr>";
                dataBody.columns.map(itemROW => {
                    rowName += "<td>" + (item[itemROW] ? item[itemROW] : '') + "</td> ";
                });
                rowName += "</tr>"

                html += rowName;
            });
            doRelease(connection);

            html += '</table>';

            if (dataBody.url)
                if (dataBody.url)
                    html += "<a href='" + dataBody.url + "' " +
                        "style=\"background: #403083;color: white;padding: 15px 25px;display: inline-block;text-decoration: none;font-weight: 600;\">CLICK HERE</a><br/>";

            console.log('Send Email With Body');
            await sendMail(dataBody.toMail, dataBody.subject, html);

            res.send('SENT:' + dataBody.toMail);
        }


    });


});


//JSON mail
app.post('/json_mail', async (req, res) => {


    let dataBody = req.body;


    var connection = await DBConnect();
    connection.execute(dataBody.sql, [], {outFormat: oracledb.OUT_FORMAT_OBJECT}, async function (user_error, user_result) {
        if (user_error) {
            console.error(user_error.message);
            doRelease(connection);

            res.send('<h1>ERROR</h1>');
        } else {
            let lists_user = user_result.rows;
            let columnTitle = "";

            dataBody.headers.map(item => {
                columnTitle += "<th>" + item + "</th> ";
            });


            let html = "<table border=\"1\" width=\"100%\"><tr>" + columnTitle + "</tr>";
            lists_user.map((item) => {

                let rowName = "<tr>";
                dataBody.columns.map(itemROW => {
                    rowName += "<td>" + (item[itemROW] ? item[itemROW] : '') + "</td> ";
                });
                rowName += "</tr>"

                html += rowName;
            });
            doRelease(connection);
            html += '</table>';
            console.log('Send Email');
            await sendMail(dataBody.toMail, dataBody.subject, html);

            res.send('SENT:' + dataBody.toMail + html);
        }


    });


});



//Job Created but not Submit
app.get('/job_create_not_submit', async(req, res) => {

    var connection = await DBConnect();
    connection.execute("SELECT DISTINCT BUYER_NAME,SOM_JOB_NO,SOM_JOB_DATE\n" +
        "FROM STYLE_ORDER_MST,BUYER_MST,STYLE_ORDER_COLOR\n" +
        "WHERE SOM_BUYER_ID=BUYER_ID\n" +
        "AND SOM_ID=SOC_SOM_ID\n" +
        "AND SOC_SHIP_STATUS=0\n" +
        "AND SOM_FLAG='REF'\n" +
        "AND NVL(SOM_CANCEL,0)=0\n" +
        "AND NVL(SOM_SUBMIT,0)=0  ORDER BY BUYER_NAME",[],{ outFormat: oracledb.OUT_FORMAT_OBJECT }, async function (user_error, user_result) {
        if(user_error){
            console.error(user_error.message);
            doRelease(connection);

            res.send('<h1>ERROR</h1>');
        } else {
            let lists_user = user_result.rows;
            let html = "<table border=\"1\" width=\"100%\"><tr><th>BUYER Name</th> <th>REF. NO</th> <th>Date</th></tr>";

            lists_user.map((item) => {
                //console.log(item);

                let day= "";
                if(item.KPOM_DATE)
                    day=date.format(item.SOM_JOB_DATE, date_time_formate);

                html += '<tr><td>'+item.BUYER_NAME+'</td><td>'+item.SOM_JOB_NO+'</td><td>'+day+'</td></tr>'
            });

            doRelease(connection);

            html+= '</table>';
            console.log('user Loader');
            var emails = req.query.email; // $_GET["id"]
            await sendMail(emails, 'Job Created but not Submit', html);
            res.send('SENT:'+emails);
        }



    });


});


//Fabric Booking Created But Not Submit
app.get('/fabric_booking_not_submit', async(req, res) => {

    var connection = await DBConnect();
    connection.execute("SELECT KPOM_NO, KPOM_DATE, KPOM_PTYPE, USR_FNAME\n" +
        "    FROM KNIT_PRO_ORD_MST,\n" +
        "        ISP_USER\n" +
        "    WHERE UPPER(KPOM_USR) = UPPER(USR_NAME)\n" +
        "    AND NVL(KPOM_FLAG, 0) = 0\n" +
        "    AND NVL(KPOM_CANCEL, 0) = 0\n" +
        "    ORDER BY USR_FNAME",[],{ outFormat: oracledb.OUT_FORMAT_OBJECT }, async function (user_error, user_result) {
        if(user_error){
            console.error(user_error.message);
            doRelease(connection);

            res.send('<h1>ERROR</h1>');
        } else {
            let lists_user = user_result.rows;
            let html = "<table border=\"1\" width=\"100%\"><tr><th>No</th> <th>DATE</th> <th>TYPE</th> <th>Name</th></tr>";

            lists_user.map((item) => {
                //console.log(item);
                let day= "";
                if(item.KPOM_DATE)
                    day=date.format(item.KPOM_DATE, date_time_formate);

                html += '<tr><td>'+(item.KPOM_NO ? item.KPOM_NO : '')+'</td><td>'+day+'</td> <td>'+item.KPOM_PTYPE+'</td><td>'+item.USR_FNAME+'</td>   </tr>'
            });
            doRelease(connection);

            html+= '</table>';
            console.log('user Loader');
            var emails = req.query.email; // $_GET["id"]
            await sendMail(emails, 'Fabric Booking Created But Not Submit', html);

            res.send('SENT:'+emails);
        }



    });


});



//Confirm Order But Cost Sheet Not Submit
app.get('/confirm_order_not_submit', async(req, res) => {

    var connection = await DBConnect();
    connection.execute("SELECT BUYER_NAME,SOM_JOB_NO, SOM_ORDER_NO,USR_FNAME,SOM_JOB_DATE,SUM(SOC_QTY) ORDER_QTY,MIN(SOC_SHIP_DATE) SHIPMENT_DATE\n" +
        "FROM STYLE_ORDER_MST,STYLE_ORDER_COLOR,BUYER_MST,ISP_USER\n" +
        "WHERE SOM_ID=SOC_SOM_ID\n" +
        "AND SOM_BUYER_ID=BUYER_ID\n" +
        "AND UPPER(SOM_USR)=UPPER(USR_NAME)\n" +
        "AND SOC_SHIP_STATUS<>2\n" +
        "AND NVL(SOM_SUBMIT,0)=1\n" +
        "AND SOM_FLAG='REF'\n" +
        "AND SOM_JOB_DATE>='01-SEP-2021'\n" +
        "AND NVL(SOM_COST_SUBMIT,0)=0\n" +
        "GROUP BY BUYER_NAME,SOM_JOB_NO,SOM_ORDER_NO,USR_FNAME,SOM_JOB_DATE\n" +
        "ORDER BY BUYER_NAME",[],{ outFormat: oracledb.OUT_FORMAT_OBJECT }, async function (user_error, user_result) {
        if(user_error){
            console.error(user_error.message);
            doRelease(connection);

            res.send('<h1>ERROR</h1>');
        } else {
            let lists_user = user_result.rows;
            let html = "<table border=\"1\" width=\"100%\">" +
                "<tr>" +
                "<th>BUYER NAME</th> " +
                "<th>JOB NO</th> " +
                "<th>ORDER NO</th> " +
                "<th>Name</th>"+
                "<th>JOB DATE</th>"+
                "<th>QTY</th>"+
                "<th>DATE</th>" +
                "</tr>";

            lists_user.map((item) => {
                //console.log(item);
                let day= "";
                if(item.SOM_JOB_DATE)
                    day=date.format(item.SOM_JOB_DATE, date_time_formate);

                let day_2= "";
                if(item.SHIPMENT_DATE)
                    day_2=date.format(item.SHIPMENT_DATE, date_time_formate);

                html += '<tr><td>'+(item.BUYER_NAME ? item.BUYER_NAME : '')+'</td><td>'+item.SOM_JOB_NO+'</td> <td>'+item.SOM_ORDER_NO+'</td><td>'+item.USR_FNAME+'</td> <td>'+day+'</td> <td>'+ item.ORDER_QTY +'</td>  <td>'+ day_2 +'</td>  </tr>'
            });
            doRelease(connection);

            html+= '</table>';
            console.log('user Loader');
            var emails = req.query.email; // $_GET["id"]
            await sendMail(emails, 'Confirm Order But Cost Sheet Not Submit', html);

            res.send('SENT:'+emails);
        }



    });


});




//Confirm Order But No Fabric Booking
app.get('/confirm_order_not_booking', async(req, res) => {

    var connection = await DBConnect();
    connection.execute("SELECT BUYER_NAME,SOM_JOB_NO,SOM_ORDER_NO,USR_FNAME,SOM_JOB_DATE,SUM(SOC_QTY) ORDER_QTY,MIN(SOC_SHIP_DATE) SHIPMENT_DATE\n" +
        "    FROM STYLE_ORDER_MST,STYLE_ORDER_COLOR,BUYER_MST,ISP_USER\n" +
        "    WHERE SOM_ID=SOC_SOM_ID\n" +
        "    AND SOM_BUYER_ID=BUYER_ID\n" +
        "    AND UPPER(SOM_USR)=UPPER(USR_NAME)\n" +
        "    AND SOC_SHIP_STATUS<>2\n" +
        "    AND NVL(SOM_SUBMIT,0)=1\n" +
        "    AND FIND_FB_NO(SOM_ID) IS NULL\n" +
        "    AND SOM_FLAG='REF'\n" +
        "    AND SOM_JOB_DATE>='01-SEP-2021'\n" +
        "    GROUP BY BUYER_NAME,SOM_JOB_NO,SOM_ORDER_NO,USR_FNAME,SOM_JOB_DATE\n" +
        "    ORDER BY BUYER_NAME",[],{ outFormat: oracledb.OUT_FORMAT_OBJECT }, async function (user_error, user_result) {
        if(user_error){
            console.error(user_error.message);
            doRelease(connection);

            res.send('<h1>ERROR</h1>');
        } else {
            let lists_user = user_result.rows;
            let html = "<table border=\"1\" width=\"100%\">" +
                "<tr>" +
                "<th>BUYER NAME</th> " +
                "<th>JOB NO</th> " +
                "<th>ORDER NO</th> " +
                "<th>Name</th>"+
                "<th>JOB DATE</th>"+
                "<th>QTY</th>"+
                "<th>DATE</th>" +
                "</tr>";

            lists_user.map((item) => {
                //console.log(item);
                let day= "";
                if(item.SOM_JOB_DATE)
                    day=date.format(item.SOM_JOB_DATE, date_time_formate);

                let day_2= "";
                if(item.SHIPMENT_DATE)
                    day_2=date.format(item.SHIPMENT_DATE, date_time_formate);

                html += '<tr><td>'+(item.BUYER_NAME ? item.BUYER_NAME : '')+'</td><td>'+item.SOM_JOB_NO+'</td> <td>'+item.SOM_ORDER_NO+'</td><td>'+item.USR_FNAME+'</td> <td>'+day+'</td> <td>'+ item.ORDER_QTY +'</td>  <td>'+ day_2 +'</td>  </tr>'
            });
            doRelease(connection);

            html+= '</table>';
            console.log('user Loader');
            var emails = req.query.email; // $_GET["id"]
            await sendMail(emails, 'Confirm Order But No Fabric Booking', html);

            res.send('SENT:'+emails);
        }



    });


});



//Accessories Purchase Order Created but Not Submit
app.get('/accessories_purchase_order_create_not_submit', async(req, res) => {

    var connection = await DBConnect();
    connection.execute("SELECT POM_NO,POM_DATE,USR_FNAME\n" +
        "    FROM PO_MST,ISP_USER\n" +
        "    WHERE UPPER(POM_USR)=UPPER(USR_NAME)\n" +
        "    AND POM_POSO_FLAG='APO'\n" +
        "    AND NVL(POM_SUBMIT_FLAG,0)=0\n" +
        "    AND UPPER(POM_USR)<>'ANSARY'\n" +
        "    ORDER BY USR_FNAME",[],{ outFormat: oracledb.OUT_FORMAT_OBJECT }, async function (user_error, user_result) {
        if(user_error){
            console.error(user_error.message);
            doRelease(connection);

            res.send('<h1>ERROR</h1>');
        } else {
            let lists_user = user_result.rows;
            let html = "<table border=\"1\" width=\"100%\">" +
                "<tr>" +
                "<th>PO NO</th> " +
                "<th>DATE</th>" +
                "<th>Name</th>"+
                "</tr>";

            lists_user.map((item) => {
                //console.log(item);
                let day= "";
                if(item.POM_DATE)
                    day=date.format(item.POM_DATE, date_time_formate);


                html += '<tr><td>'+(item.POM_NO ? item.POM_NO : '')+'</td><td>'+day+'</td> <td>'+item.USR_FNAME+'</td> </tr>'
            });
            doRelease(connection);

            html+= '</table>';
            console.log('user Loader');
            var emails = req.query.email; // $_GET["id"]
            await sendMail(emails, 'Accessories Purchase Order Created but Not Submit', html);

            res.send('SENT:'+emails);
        }



    });


});



var DBConnect = async () => {
    return await oracledb.getConnection({
        user: process.env.dbuser || "MSDERP",
        password: process.env.dbpass || "AAA",
        connectString: process.env.dbhost || "103.205.181.106/PDB"
    });
}


var sendMail = async (to, subject, message) => {

    const transporter = nodemailer.createTransport({
        host: process.env.emailHost || 'mail.besterp-bd.com',
        port: process.env.emailPort || 465,
        secure: true,
        auth: {
            user: process.env.emailUser|| 'erp@besterp-bd.com',
            pass: process.env.emailPassword || 'Ah@#15172500'
        }
    });

// send email
    await transporter.sendMail({
        from: '"BST-ERP" <erp@besterp-bd.com>',
        to: to,
        subject: subject,
        html: message
    });
}


function doRelease(dbconn) {
    dbconn.close(
        function (err) {
            if (err)
                console.error(err.message);
        });
    console.log(`db released successfully`)
}



server.listen(server_port, async () => {
    console.log('listening on *:3000');
});


