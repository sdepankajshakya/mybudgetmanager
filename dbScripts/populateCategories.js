/**
 * to add the entries run this script with the db name, for eg
 * for local : mongo localhost:27017/budget-manager ./dbScripts/populateCategories.js
 * for cloud: mongo mongodb+srv://admin:fnurq8EzMN8JH7sV@cluster0.tpeau.mongodb.net/budget-manager ./dbScripts/populateCategories.js
 */

db.categories.insertMany([
  {
    name: "Bills",
    type: "expense",
    icon: "assets/images/categories/bills.png",
  },
  {
    name: "Cosmetics",
    type: "expense",
    icon: "assets/images/categories/cosmetics.png",
  },
  {
    name: "Education",
    type: "expense",
    icon: "assets/images/categories/education.png",
  },
  {
    name: "Entertainment",
    type: "expense",
    icon: "assets/images/categories/entertainment.png",
  },
  {
    name: "Fitness",
    type: "expense",
    icon: "assets/images/categories/fitness.png",
  },
  {
    name: "Food",
    type: "expense",
    icon: "assets/images/categories/food.png",
  },
  {
    name: "Fuel",
    type: "expense",
    icon: "assets/images/categories/fuel.png",
  },
  {
    name: "Grocery",
    type: "expense",
    icon: "assets/images/categories/grocery.png",
  },
  {
    name: "HealthCare",
    type: "expense",
    icon: "assets/images/categories/healthcare.png",
  },
  {
    name: "Home",
    type: "expense",
    icon: "assets/images/categories/home.png",
  },
  {
    name: "Insurance",
    type: "expense",
    icon: "assets/images/categories/insurance.png",
  },
  {
    name: "Investment",
    type: "expense",
    icon: "assets/images/categories/investment.png",
  },
  {
    name: "Other Income",
    type: "income",
    icon: "assets/images/categories/other_income.png",
  },
  {
    name: "Party",
    type: "expense",
    icon: "assets/images/categories/party.png",
  },
  {
    name: "Pets",
    type: "expense",
    icon: "assets/images/categories/pets.png",
  },
  {
    name: "Repairs",
    type: "expense",
    icon: "assets/images/categories/repairs.png",
  },
  {
    name: "Salary",
    type: "income",
    icon: "assets/images/categories/salary.png",
  },
  {
    name: "Shopping",
    type: "expense",
    icon: "assets/images/categories/shopping.png",
  },
  {
    name: "Transportation",
    type: "expense",
    icon: "assets/images/categories/transportation.png",
  },
  {
    name: "Vacation",
    type: "expense",
    icon: "assets/images/categories/vacation.png",
  },
]);
