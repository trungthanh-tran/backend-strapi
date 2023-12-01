global.beginRound = new Object();
global.endRound = new Object();

module.exports = {
  async afterUpdate(model) {
    const campaign_id = model.params.data.id;
    if (global.beginRound[campaign_id]) {
      clearTimeout(global.beginRound[campaign_id]);
      delete global.beginRound[campaign_id];
    }
    if (global.endRound[campaign_id]) {
      clearTimeout(global.endRound[campaign_id]);
      delete global.endRound[campaign_id];
    }
    const number_of_events = model.result.events.length;
    const length_of_campaign =
      number_of_events * 30 + (number_of_events - 1) * 6;
    const targetDate = new Date(model.params.data.begin_time);
    let timeDifferenceInMilliseconds =
      targetDate.getTime() - new Date().getTime();
    if (timeDifferenceInMilliseconds >= 0) {
      if (model.params.data.enough_participants) {
        const apiBegin = setTimeout(function () {
          strapi.io.to("camp_" + campaign_id).emit("beginCampaign", "end");
        }, timeDifferenceInMilliseconds);
        const apiEnd = setTimeout(async function () {
          let campaign = campaign_id;
          let in_query = "(";
          const events = await strapi.entityService.findOne(
            "api::round.round",
            campaign,
            {
              populate: "events",
            }
          );
          events.events.forEach((element) => {
            in_query =
              in_query + "(" + element.id + "," + element.correct_answer + "),";
          });
          in_query = in_query.slice(0, -1);
          in_query = in_query + ")";
          const result = await strapi.db.connection.raw(`
          SELECT user, sum(score) as total_score 
          FROM results where campaign_id = ${campaign}  and (round_id, answer) in ${in_query} GROUP BY user
          ORDER BY total_score DESC
          LIMIT 10
        `);
          strapi.io.to("camp_" + campaign_id).emit("endCampaign", result);
        }, (timeDifferenceInMilliseconds + (length_of_campaign * 1000)));
        global.beginRound[campaign_id] = apiBegin;
        global.endRound[campaign_id] = apiEnd;
      } else {
        const apiBegin = setTimeout(function () {
          strapi.io.to("camp_" + campaign_id).emit("cancelCampaign", "cancel");
          global.beginRound[campaign_id] = apiBegin;
        });
      }
    }
  },
};
