const currentDirDiv = document.querySelector("#current-dir");
const renderedItems = document.getElementsByClassName("items");
const promptContainer = document.querySelector("#prompt-container");
const backwardBtn = document.querySelector("#backward-btn");
const dirPathInput = document.querySelector("#dir-name-input");
const deleteItemBtn = document.getElementsByClassName("delete-item-btn");
const deleteConfirmationBtns = document.querySelectorAll(
  ".delete-confirmation-btns"
);

const deleteConfirmationDialog = document.querySelector(
  "#delete-confirmation-dialog"
);

const alertDiv = document.querySelector("#alert-div");

let isDeletable = false;

dirPathInput.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    try {
      const response = await fetch(`/enterPath=${dirPathInput.value}`);
      const renderedHTML = await response.text();

      currentDirDiv.innerHTML = renderedHTML;

      handleItemsBtnsAndIcons([...renderedItems], [...deleteItemBtn]);
    } catch (err) {
      console.log(err);
    }
  }
});

backwardBtn.addEventListener("click", () => {
  navigateThroughDirs({ isForward: false });
});

const updatePath = (path) => {
  dirPathInput.value = path;
};

const navigateThroughDirs = async ({ dirName, isForward }) => {
  try {
    const url = isForward ? `/navForward=${dirName}` : "/navBackward";

    const response = await fetch(url);
    const renderedHTML = await response.text();
    const getPath = await fetch("/getPath");
    const jsonPath = await getPath.text();

    currentDirDiv.innerHTML = renderedHTML;

    handleItemsBtnsAndIcons([...renderedItems], [...deleteItemBtn]);
    updatePath(jsonPath);
  } catch (err) {
    console.log(err);
  }
};

const loadIcons = async () => {
  const items = document.querySelectorAll(".item-icons");
  const dirIconResponse = await fetch("/getIcons?dir.png");
  const fileIconResponse = await fetch("/getIcons?files.png");

  const dirIcon = await dirIconResponse.blob();
  const fileIcon = await fileIconResponse.blob();

  items.forEach((item) => {
    item.src = item.classList.contains("dir")
      ? URL.createObjectURL(dirIcon)
      : URL.createObjectURL(fileIcon);
  });
};

const makeItemsClickable = (items) => {
  items.forEach((item) => {
    item.addEventListener("click", () => {
      if (item.classList.contains("dir"))
        navigateThroughDirs({
          dirName: item.textContent,
          isForward: true,
        });
      else {
        openFile(item.textContent);
      }
    });
  });
};

const openFile = async (fileName) => {
  const response = await fetch(`/readFile=${fileName}`);
  const renderedHTML = await response.text();

  currentDirDiv.innerHTML = renderedHTML;
  handleItemsBtnsAndIcons([...renderedItems], [...deleteItemBtn]);
};

const makeRmItemClickable = (items) => {
  items.forEach((item) => {
    item.addEventListener("click", async () => {
      const deletionConfirmation = (e) => {
        if (e.target.textContent === "YES") removeItem(itemName);

        deleteConfirmationDialog.close();

        deleteConfirmationBtns.forEach((button) => {
          button.removeEventListener("click", deletionConfirmation);
        });
      };

      const itemName =
        item.parentElement.firstElementChild.nextElementSibling.textContent;

      if (itemName.match(/\.txt/)) {
        deleteConfirmationDialog.show();
        deleteConfirmationBtns.forEach((button) => {
          button.addEventListener("click", deletionConfirmation, {
            once: true,
          });
        });
      } else {
        alertDiv.style.display = "block";
        alertDiv.textContent = "No permission to remove!";
        setTimeout(() => {
          alertDiv.style.display = "none";
        }, 1000);
      }
    });
  });
};

const creationDialog = document.querySelector("#creation-dialog");
const itemNameInput = document.querySelector("#item-name-input");
const creationBtns = document.querySelectorAll(".creation-btns");
const createBtn = document.querySelector("#create-btn");

creationBtns.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.textContent === "CONFIRM") createItem(itemNameInput.value);
    creationDialog.close();
    itemNameInput.value = "";
  });
});

createBtn.addEventListener("click", () => {
  creationDialog.show();
});

const createItem = async (itemName) => {
  try {
    const response = await fetch(`/createItem=${itemName}`);

    if (response.ok) {
      const renderedHTML = await response.text();

      currentDirDiv.innerHTML = renderedHTML;

      handleItemsBtnsAndIcons([...renderedItems], [...deleteItemBtn]);

      alertDiv.style.display = "block";
      alertDiv.textContent = "Successfully created item";
      setTimeout(() => {
        alertDiv.style.display = "none";
      }, 1500);
    }
  } catch (err) {
    console.log(err);
  }
};

const removeItem = async (itemName) => {
  try {
    const response = await fetch(`/removeItem=${itemName}`);

    if (response.ok) {
      const renderedHTML = await response.text();
      currentDirDiv.innerHTML = renderedHTML;
      handleItemsBtnsAndIcons([...renderedItems], [...deleteItemBtn]);

      alertDiv.style.display = "block";
      alertDiv.textContent = "Successfully removed item";
      setTimeout(() => {
        alertDiv.style.display = "none";
      }, 1500);
    }
  } catch (err) {
    console.log(err);
  }
};

const handleItemsBtnsAndIcons = (items, btns) => {
  makeItemsClickable(items);
  makeRmItemClickable(btns);
  loadIcons();
};

navigateThroughDirs({ dirName: "C:\\", isForward: true });
