const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const cors = require("cors");
require("dotenv").config();

app.use(express.json());
app.use(cors());

const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

const saveToGoogleSheets = async (surveyResponses) => {
    const serviceAccountAuth = new JWT({
        email: process.env.EMAIL,
        key: '-----BEGIN PRIVATE KEY-----MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCeMUgroJl1146AS6Unomvp6KNuF2gGzkIoR5R0dzpnEGo0f7mnAPDGJLVquOrw/idJ4HWNjGQXCPpuQvj8ZKIWcvssUAmbJLwT0rzz3/iluTBMbIwmTSI/Dd42XEM4BBylzYKNQfIN7lYzv6aXP1uPKDFJXY1v5fKBpbZqFzPHPZngPvL62WvRnmNkJMmso3RWvKkDpejEGZkCUuNyiU8UH5BU8G+eeaWPzjNFVV/fmURcGDu5U+8R6qLG1XI39P1f7LuzhTa5KZZGmOHPTym0C+fAo2SAo82CO1VrEPyfTOMJxjXDlOwFStDY93IGI13FqPyGhj2Ebu6zBNhpfhptAgMBAAECggEAGhFV6raGw0f3mAWfHAZkUQHAeKJLxp9TgI63FHAXRCeM0MThY3dAte4TpRf+wyKmd8KQrHgfgDo/Bk9r9y9gFGHzKOyxgIrPoVafQ3K7Zxe6sUVL3P3l8E0JOpz+iKsIy3uvkTZ2PDxzoQhqW88Zd+AwKv5LEc7rJNkZU6cqJaErK4A0xiuZolBI7wm+4hkOO1kzbokA8uABkK/XJhcrZgnA3ACOsD1ZKnmY/Pqh+nK7Kt0z1J0ULkfZ62KGBJubH7ni9cFzVO1dWlew10pYA/lGz97ZCkc4fcgIRBzCFaUcbcQa/IE1n4IewMO2M3W+/jQcxmXCITaIK0RZDaOnMwKBgQDRZA0OsDWH9E7Lx5A9vpzoHzr8a4xChNAMixqQGhsYNn068kPEyVBDRsrJr4Eac6gqZE+vgGPP5vlT4tWusXZ2mYaGnTS3uEZ3WqX9oOsgoBcq4VIKyyFJhMSp0n5Phjp1A4c/S09EBKrLDm+nIu09ILrf9wTWivK0IUIu/FKLowKBgQDBZ72W6QDLObPJXEDGlETP+rGHDU9jeUIqg0zDVBvUG0xuBUF+TtlxFMkQXtTIJtZcFA3wXiIJfjeBVC7zUq849MP9spEW8Tm7QwP3XuX0SARE/mEOleSuwOWwy7cqP+5uqtbkiNZMx/0R0vVVTsLpVI52lE4Ol4V28DxIl7cirwKBgQDNmtC3e48U0HAO6QZZmrG3u/LPqUswhflEV9LdbMTuIZMWLo0czhBh/0FgiVTcBHU8KwOT8R4RJ1vrYvEveFI6YsYVqIf7XpbS28/iHADFKG2XTWih8JPe/N+fYXFl5QfBnpVPMUPEJlEO0j4Qf9s0Cs9027mEcSugdIfoWxsywQKBgGZHWGnQOs0+bKeWE+NwUZuzNeL31P4ECEu3OAcsGbNn5FliiiojxLYaieIQZHKcp0v2hxCQl2txxiSswk+HcIasWmF152i8lQ1E+Xn+Q5mV5DwgUm+GMXOBK3b9pJXBTXRVAGPHQZ1FPb4JVBiTGFyQjO6Eq2roEnq9vQOeyAidAoGBAKmLzam+b7LDftdQVgTLo57yHBYuTHwRLfB0gcIgjuaMeAx1VbPLzAG3iWTx0VCPHCKkC+0Wu+etFwssoLjIFG7RHrqL/WSSfQ31KKl/gdekd6Nh8IxDzIZpyWl52mimPXuWYRRhNOB7ZLskL1xHuESu8BHzkFPBzzSARK2Ih2Ry-----END PRIVATE KEY-----',
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(process.env.SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // Fetch the headers (column names) from the Google Sheets document
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;

    // Create an object to hold the values for each row
    const rowValues = {};

    // Loop through the keys in surveyResponses and map them to the corresponding headers
    for (const key in surveyResponses) {
        if (Object.hasOwnProperty.call(surveyResponses, key)) {
            const value = surveyResponses[key];

            // Find the index of the header in the headers array
            const headerIndex = headers.indexOf(key);

            // If the header exists, add the value to the corresponding key in rowValues
            if (headerIndex !== -1) {
                rowValues[key] = Array.isArray(value) ? value.join(", ") : value;
            }
        }
    }

    // Add the row to the Google Sheets document
    await sheet.addRow(rowValues);
};

app.get("/", (req, res) => {
    res.send("App is up and running!");
});

app.post("/encuesta", (req, res) => {
    try {
        const datos = req.body;
        console.log(req.body);
        saveToGoogleSheets(datos);

        res.status(200).json({
            ok: true,
            message: "Datos recibidos!",
        });
    } catch (error) {
        console.log("Error", error.message);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
