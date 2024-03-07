import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';

const app = express();
const port = 3000;

let isItemTableInitialised = false

const db = new pg.Client({
  user: 'postgres',
  password: 'GTPostgres',
  port: 5433,
  host: 'localhost',
  database: 'todolist'
})

db.connect()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let items = undefined
// [
//   { id: 1, title: "Milk" },
// ];

const initialiseItemTable = async()=>{
    try {
      const result = await db.query("SELECT * FROM todolist")
      if(result?.rows?.length > 0){
        items = result.rows
        // console.log(items)
      }else{
        console.log(`Empty database result received`)
      }
      
    } catch (error) {
        console.log(`Error occurred while initialising the table:`+ error)
    } 
}

const addItem = async (item)=>{
  console.log(`In addItem`)
  try {
    const result = await db.query("INSERT INTO todoList (title) VALUES ($1) RETURNING *",[item])
    if(result?.rows?.length > 0){
      items.push(result.rows[0])
      console.log(JSON.stringify(items))
    }
  } catch (error) {
      console.log(error)
  }
}

const updateItem = async(id,content) =>{
  console.log(`Updating the list item`, JSON.stringify(items))
  items.forEach(element => {
    if(element.id === id){
      element.title = content
    }
  });
  try {
    await db.query("UPDATE todolist SET title = $1 WHERE id = $2",[content,id])
  } catch (error) {
      console.log(`Error in updateItem : `,error)
  }
}

const deleteItem = async(id)=>{
  console.log(`Inside deleteItem`)

  // First we will delete contents from our internal array of items.
  items = items.filter(item=>item.id !== id)

  // Then we will delete the respective item from the db.
  try {
    await db.query("DELETE FROM todolist where id = $1",[id])
  } catch (error) {
    console.log(`Error in deleteItem : `,error)
  }

}

app.get("/", async (req, res) => {

  // First initialise the array of list items
  if(!isItemTableInitialised){
    isItemTableInitialised = true
   await initialiseItemTable()
  }

  // Render the landing page.
  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
});

app.post("/add", async(req, res) => {
  const item = req.body.newItem;

  // Add item to the db.
  await addItem(item)

  res.redirect("/");
});

app.post("/edit", async(req, res) => {
  console.log(`Inside /edit function`,req.body)

  // Updating the item with the passed id.
  const {updatedItemId,updatedItemTitle:content} = req.body
  await updateItem(parseInt(updatedItemId),content)

  res.redirect('/')
});

app.post("/delete", async(req, res) => {
  console.log(`Inside /delete : data`,req.body)

  // Deleting the whose id is passed.
  const { deleteItemId } = req.body
  await deleteItem(parseInt(deleteItemId))

  res.redirect('/')
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
