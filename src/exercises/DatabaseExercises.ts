import { DatabaseService } from '@src/support/DatabaseService';
import { Runner } from '@src/support/Runner';
import { dump } from '@src/support/utils';
import { Command, Option } from 'nest-commander';

export type TOptions = {
  exercise: string;
};

export type TExercise001Row = {
  n1: string;
  n2: string | null;
  n3: string | null;
};

export type TExercise002Row = {
  category: string;
  products: number;
};

export type TExercise003Row = {
  id: string;
  employee: string;
  sub_total: number;
  tax: number;
  total: number;
};

export type TExercise004Row = {
  company: string;
  total: number;
};

@Command({
  name: 'database',
})
export class DatabaseExercises extends Runner<TOptions> {
  public constructor(protected readonly dbSvc: DatabaseService) {
    super();
  }

  @Option({
    flags: '--exercise <string>',
    description: 'Exercise to run.',
    required: true,
  })
  public parseProductPageUrl(value: string): string {
    return value;
  }

  public override async doRun(options: TOptions): Promise<void> {
    switch (options.exercise.replaceAll(/^0+/g, '').trim()) {
      case '1':
        console.log(dump(await this.exercise001()));
        return;
      case '2':
        console.log(dump(await this.exercise002()));
        return;
      case '3':
        console.log(dump(await this.exercise003()));
        return;
      case '4':
        console.log(dump(await this.exercise004()));
        return;
      default:
        throw new Error(`Unknown exercise: "${options.exercise}".`);
    }
  }

  /**
   * Returns a record set of all categories in the database. You may assume that the category tree is at most 3-levels
   * deep. Each record should have 3 fields (n1, n2, n3) corresponding to the 1st, 2nd, and 3rd level category names.
   * The n2 and n3 fields can be null, and each category should appear also on a record on its own, even it has
   * children. The record set should be ordered alphabetically by (n1, n2, n3), nulls first.
   *
   * For example, given a category tree like this:
   *
   * - AXX
   *   - AAX
   *     - AAA
   *     - AAB
   *   - ABX
   *     - ABA
   *   - ACX
   * - BXX
   *
   * Your query should return:
   *
   * [
   *   { n1: 'AXX', n2: null, n3: null },
   *   { n1: 'AXX', n2: 'AAX', n3: null },
   *   { n1: 'AXX', n2: 'AAX', n2: 'AAA' },
   *   { n1: 'AXX', n2: 'AAX', n2: 'AAB' },
   *   { n1: 'AXX', n2: 'ABX', n3: null },
   *   { n1: 'AXX', n2: 'ABX', n2: 'ABA' },
   *   { n1: 'AXX', n2: 'ACX', n2: null },
   *   { n1: 'BXX', n2: null, n3: null }
   * ]
   *
   * Note that it is possible to solve this exercise using the libraries and utilities already included in the project.
   * You may install and use additional libraries, as long as the exercise is solved by sending a single, hand-crafted
   * query to the database. You are not allowed post-process your result, for example by altering it before returning or
   * combining the result of multiple queries using TypeScript.
   */
  public async exercise001(): Promise<TExercise001Row[]> {

    return await this.dbSvc.db.all<TExercise001Row[]>(`
    SELECT
      c1.name AS n1,
      c2.name AS n2,
      c3.name AS n3
    FROM categories c1
    LEFT Join categories c2 ON c2.parent_category_id = c1.id
    LEFT JOIN categories c3 ON c3.parent_category_id = c2.id
    ORDER BY n1, n2, n3;
  `);
  }

  /**
   * Returns a record set of all top-level categories in the database and the number of products in each of them,
   * including products in their children categories. Each record should have 2 fields (categories, products),
   * respectively the name of the top-level category and the number of products. The record set should also include any
   * top-level category with no products (in which case "products" would be set to 0), and should be sorted from most to
   * least products.
   *
   * For example, given the category tree from exercise 001 and these products:
   *
   * - Product 'A' in category 'AXX'
   * - Product 'B' in category 'AAA'
   * - Product 'C' in category 'ACX'
   *
   * Your query should return:
   *
   * [
   *   { category: 'AXX', products : 3 },
   *   { category: 'BXX', products : 0 },
   * ]
   *
   * Note that it is possible to solve this exercise using the libraries and utilities already included in the project.
   * You may install and use additional libraries, as long as the exercise is solved by sending a single, hand-crafted
   * query to the database. You are not allowed post-process your result, for example by altering it before returning or
   * combining the result of multiple queries using TypeScript.
   */
  public async exercise002(): Promise<TExercise002Row[]> {
    return await this.dbSvc.db.all<TExercise002Row[]>(`
    WITH RECURSIVE category_hierarchy AS (
      SELECT id, name, parent_category_id
      FROM categories
      WHERE parent_category_id IS NULL

      UNION ALL

      SELECT c.id, c.name, c.parent_category_id
      FROM categories c
      JOIN category_hierarchy ch ON c.parent_category_id = ch.id
    )

    SELECT
      tlc.name AS category,
      COALESCE(SUM(p.count), 0) AS products
    FROM category_hierarchy tlc
    LEFT JOIN (
      SELECT c.id, COUNT(p.id) AS count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
    ) AS p ON p.id IN (SELECT id FROM category_hierarchy WHERE id = tlc.id OR parent_category_id = tlc.id)
    GROUP BY tlc.name
    ORDER BY products DESC;
  `);
  }

  /**
   * Returns a record set the top 100 orders by total, sorted highest to lowest. The total of an order needs to be
   * calculated from its items, applying a 5% tax where required. Money is represented using fixed-precision integers,
   * with a precision of cents (for example, $1.02 = 102). Also note that boolean values in SQLite are represented as
   * integers where 0 = false and 1 = true.
   *
   * For example, given an order with the following items:
   *
   * - Item 1: quantity=2, unit_price=102, is_tax_exempt=0
   * - Item 2: quantity=5, unit_price=200, is_tax_exempt=1
   *
   * The order total would be calculated as:
   *
   *  floor(2 * 102 * 1.05) + 5 * 200 = 214 + 1000 = 1214
   *
   * Additionally, each record in the result needs to include the full name of the employee that placed the order
   * (first_name + " " + last_name), and a breakdown of sub_total (i.e. the total before tax) and tax for the order.
   *
   * Note that it is possible to solve this exercise using the libraries and utilities already included in the project.
   * You may install and use additional libraries, as long as the exercise is solved by sending a single, hand-crafted
   * query to the database. You are not allowed post-process your result, for example by altering it before returning or
   * combining the result of multiple queries using TypeScript.
   */
  public async exercise003(): Promise<TExercise003Row[]> {
    return await this.dbSvc.db.all<TExercise003Row[]>(`
    SELECT
      o.id,
      e.first_name || ' ' || e.last_name AS employee,
      FLOOR(SUM(item.quantity * p.unit_price * (1.0 + 0.05 * p.is_tax_exempt))) AS total,
      FLOOR(SUM(item.quantity * p.unit_price)) AS sub_total,
      FLOOR(SUM(item.quantity * p.unit_price * 0.05 * p.is_tax_exempt)) AS tax
    FROM orders o
    JOIN employees e ON o.created_by = e.id
    JOIN items item ON o.id = item.order_id
    JOIN products p ON item.product_id = p.id
    GROUP BY o.id
    ORDER BY total DESC
    LIMIT 100;
  `);
  }

  /**
   * Returns a record set of all company names and the sum of the totals of all orders placed by their respective
   * employees in 2022, sorted by highest to lowest. Order totals are to be calculated using the method described in
   * exercise 003.
   *
   * Note that it is possible to solve this exercise using the libraries and utilities already included in the project.
   * You may install and use additional libraries, as long as the exercise is solved by sending a single, hand-crafted
   * query to the database. You are not allowed post-process your result, for example by altering it before returning or
   * combining the result of multiple queries using TypeScript.
   */
  public async exercise004(): Promise<TExercise004Row[]> {
    return await this.dbSvc.db.all<TExercise004Row[]>(`
    SELECT
      c.name as company,
      COALESCE(FLOOR(SUM(item.quantity * p.unit_price * (1.0 + 0.05 * p.is_tax_exempt))), 0) AS total
    FROM orders o
    JOIN employees e ON o.created_by = e.id
    JOIN companies c ON c.id = e.company_id
    JOIN items item ON o.id = item.order_id
    JOIN products p ON item.product_id = p.id
    WHERE strftime('%Y', datetime(o.created_at, 'unixepoch')) = '2022'
    GROUP BY e.company_id
    ORDER BY total DESC;
  `);
  }
}
