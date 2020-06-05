import knex from '../database/connection';
import { Request, Response } from 'express';

class PointsController {

    async index(request: Request, response: Response) {
        const { city, uf, items } = request.query;

        if (city == null && uf == null && items == null){
            const points = await knex('points');
            return response.json(points);

        }

        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));

        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*')

        return response.json(points);

    }

    async show(request: Request, response: Response) {
        const { id } = request.params;

        const point = await knex('points').where('id', id).first();

        if (!point) {
            return response.status(400).json({ message: "Point not found" });
        }

        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('items.title');

        return response.json({ point, items });
    }

    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items,
        } = request.body;

        const trx = await knex.transaction();

        const point = {
            image: 'https://s2.glbimg.com/vmo9jpOdJ51CkO8NMtjPK5RNIHg=/512x320/smart/e.glbimg.com/og/ed/f/original/2018/10/11/como-gastar-menos-no-mercado.jpg',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
        }

        const ids = await trx('points').insert(point);

        const pointItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id: ids[0],
            };
        })

        await trx('point_items').insert(pointItems);

        await trx.commit();

        return response.json({
            id: ids[0],
            ...point,
        });

    }
}

export default PointsController;