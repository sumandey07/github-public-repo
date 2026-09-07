### Github API Repo Access

- This is a website where you can search for a valid github username to get the profile details and the list of that user's public repositories. Here you can see the github user's name, profile picture, social links, location, profile bio.

- Also for the list of repositories, we can see the name of each repository, with its description and its topics that are include in each repository.

- It is developed using Pure HTML, CSS, Javascript, Bootstrap and to access the github profiles I have used the github api. For the icons I have used Fontawesome.

- At first you have to create an access token to authorize myself so that you can make more github api requestes per hour. Next, You have to create an **.env** file on the project root. Then define the access token value as key name of **ACCESS_TOKEN**.

- Then you can access it in your code by using the key name as **process.env.ACCESS_TOKEN**.

- Don't forget to add the **.env** file to your **.gitignore** file.

- Lastly, you have to include the token in the header of each request (if you are using postman for testing) or you have to add it to the value of fetch request header Authorization key so that you can access the github profiles with the help of github api. Now you ready to use the website.

> Note: You have to add the below code at the starting of the script file to access the environment variables (If you are using vanilla javascript), otherwise it will throw a reference error that **process is not defined**.


You can access the live website here: [Vercel](https://githubpubrepo.vercel.app/)
