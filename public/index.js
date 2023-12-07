const currentFolderDiv = document.querySelector("#current-folder");
const renderedItems = document.getElementsByClassName("items");
const promptContainer = document.querySelector("#prompt-container");
const backwardBtn = document.querySelector("#backward-btn");
const dirPathInput = document.querySelector("#dir-name-input");

dirPathInput.addEventListener("enter", () => {

});

backwardBtn.addEventListener("click", () => {
  navigateThroughFilesAndFolders({ isForward: false });
});

const updatePath = (path) => {
  dirPathInput.value = path;
};

const navigateThroughFilesAndFolders = async ({ dirName, isForward }) => {
  try {
    const url = isForward ? `/navForward+${dirName}` : "/navBackward";

    const data = await fetch(url);
    const renderedHTML = await data.text();
    const getPath = await fetch("/getPath");
    const jsonPath = await getPath.text();

    currentFolderDiv.innerHTML = renderedHTML;

    makeItemsClickable([...renderedItems]);
    updatePath(jsonPath);
  } catch (err) {
    console.log(err);
  }
};

const makeItemsClickable = (items) => {
  items.forEach((item) => {
    item.addEventListener("click", () => {
      navigateThroughFilesAndFolders({
        dirName: item.textContent,
        isForward: true,
      });
    });
  });
};

navigateThroughFilesAndFolders({ dirName: "C:\\", isForward: true });
