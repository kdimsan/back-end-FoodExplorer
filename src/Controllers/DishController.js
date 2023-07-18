const knex = require("../database/knex");
const AppError = require("../utils/AppError");

class DishController{
    async create(request, response) {
        const { name, price, description, ingredients } = request.body;
        const { user_id } = request.query;
        
        const [user] = await knex("users").where({id: user_id});

        if(!user) {
            throw new AppError("Usuário inexistente.");
        }

        if(user.isAdmin !== 1 ){
            throw new AppError("Usuário não é administrador e não pode editar pratos.");
        }

        const [dishId] = await knex("dish").insert({
            name,
            price,
            description,
            user_id
        });

        const ingredientsInsert = ingredients.map(ingredient => {
           return {
            title: ingredient,
            dish_id: dishId,
            user_id
           }
        });

        await knex("ingredients").insert(ingredientsInsert);
        response.json("Criado com sucesso.");
        
    }

    async update(request, response) {
        const { name, price, description, ingredients } = request.body;
        
        const { user_id, id } = request.query;
        
        const [user] = await knex("users").where({id: user_id});

        if(!user) {
            throw new AppError("Usuário inexistente.");
        }

        if(user.isAdmin !== 1 ){
            throw new AppError("Usuário não é administrador e não pode editar pratos.");
        }

        const [dish] = await knex("dish").where({id});

        dish.name = name ??dish.name;
        dish.price = price ?? dish.price;
        dish.description = description ?? dish.description;

        await knex("dish").where({id}).update({
            name: dish.name,
            price: dish.price,
            description: dish.description,
            updated_at: knex.fn.now()
        });
        
        if(!ingredients){
            return
        } 

        await knex("ingredients").where({ dish_id: dish.id }).delete();

        const ingredientsInsert = ingredients.map(ingredient => {
            return {
             title: ingredient,
             dish_id: id,
             user_id
            }
         });
         await knex("ingredients").insert(ingredientsInsert);
         response.json({dish, ingredientsInsert})
    }

    async delete(request, response) {
        const { id, user_id } = request.query;

        const [user] = await knex("users").where({id: user_id});
        
        if(!user) {
            throw new AppError("Usuário não encontrado.");
        }

        if(!user.isAdmin) {
            throw new AppError("Usuário não tem poderes de admin.");
        }

        await knex("dish").where({id}).delete();
        response.json("Deletado com sucesso!");
    }

}

module.exports = DishController;