const { join } = require("path");
const { createReadStream, readdirSync } = require("fs");
const arrayToTxtFile = require("array-to-txt-file");

const csv = require("csv-parser");
const normalize = require("normalize-strings");

const INPUT_DIRECTORY_NAME = "input";
const OUTPUT_DIRECTORY_NAME = "output";

const fileNames = readdirSync(join(__dirname, INPUT_DIRECTORY_NAME));
if (!fileNames) {
  return console.error("Unable to scan directory: " + err);
}

const skipHeaders = [
  "id",
  "sku",
  "nazwa",
  "opublikowany",
  "opis",
  "cena_promocyjna",
  "cena",
  "pola_wholesale_customer_wholesale_price",
  "tagi",
  "obrazki",
  "nazwa_atrybutu_1",
  "wartosci_atrybutu_1",
  "atrybut_1_globalny",
  "nazwa_atrybutu_2",
  "wartosci_atrybutu_2",
  "atrybut_2_globalny",
];

const saveOutput = (data, name = "output") => {
  arrayToTxtFile(data, `./${OUTPUT_DIRECTORY_NAME}/${name}.txt`, (err) => {
    if (err) {
      return console.error(err);
    }
    console.log("Successfully wrote to txt file to output.txt");
  });
};

const getCsvData = async (csvFileName) => {
  let SheetResults = [];

  return new Promise((resolve, reject) => {
    createReadStream(csvFileName)
      .on("error", (error) => {
        reject(error);
      })
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            normalize(header).trim().toLowerCase().replace(/\s/g, "_").replace(/\:/g, ""),
          mapValues: ({ value }) => value.toLowerCase().trim(),
        })
      )
      .on("data", (data) => {
        const rowData = { ...data };

        skipHeaders.map((keys) => {
          delete rowData[keys];
        });

        console.log(rowData);

        const rowValuesNoNumbers = Object.values(rowData).map((index) =>
          index.replace(/\d/g, "").replace("\\,", "").replace(/^\-/g, "").trim()
        );

        const rowValuesDone = rowValuesNoNumbers.filter((el) => el != "");

        SheetResults.push(...rowValuesDone);
      })
      .on("end", async () => {
        resolve([...new Set(SheetResults)]);
      });
  });
};

const filterAllSheets = async (SheetsName) => {
  const uniqValue = [];
  uniqValue.push(
    ...(await Promise.all(SheetsName.map((sheet) => getCsvData(join("data", sheet)))))
  );

  return [...new Set(uniqValue.flat(Infinity))];
};

const SplitSentencesAndOutputUniq = (data) => {
  const outputWords = data.map((el) => el.split(" "));
  return [...new Set(outputWords.flat(Infinity))];
};

(async function init() {
  const uniqWords = await filterAllSheets(fileNames);
  console.log(`get ${uniqWords.length} uniq Words`);

  const uniqSingleWords = SplitSentencesAndOutputUniq(uniqWords);
  saveOutput(uniqSingleWords, "output_uniqSingleWords");
})();
