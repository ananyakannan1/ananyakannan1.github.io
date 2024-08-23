count = 0


function didClick() {
count += 1
document.getElementById("counter").innerHTML = `you've clicked ${count} times!`
}

document.getElementById("MyButton").addEventListener("click", didClick)
