from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.company import Company


def seed_subjects(db: Session):
    subjects_data = [
        {
            "name": "Data Structures and Algorithms",
            "slug": "dsa",
            "topics": [
                "Arrays",
                "Strings",
                "Linked Lists",
                "Stacks and Queues",
                "Trees",
                "Graphs",
                "Dynamic Programming",
                "Sorting and Searching",
            ],
        },
        {
            "name": "Database Management Systems",
            "slug": "dbms",
            "topics": [
                "SQL",
                "Normalization",
                "Transactions",
                "Indexing",
                "Joins",
            ],
        },
        {
            "name": "Operating Systems",
            "slug": "operating-systems",
            "topics": [
                "Processes and Threads",
                "CPU Scheduling",
                "Deadlocks",
                "Memory Management",
                "Paging",
            ],
        },
        {
            "name": "Computer Networks",
            "slug": "computer-networks",
            "topics": [
                "OSI Model",
                "TCP/IP",
                "HTTP and HTTPS",
                "DNS",
                "Network Security",
            ],
        },
        {
            "name": "Object Oriented Programming",
            "slug": "oops",
            "topics": [
                "Classes and Objects",
                "Inheritance",
                "Polymorphism",
                "Abstraction",
                "Encapsulation",
            ],
        },
    ]

    for subject_data in subjects_data:
        subject = db.query(Subject).filter(
            Subject.slug == subject_data["slug"]
        ).first()

        if not subject:
            subject = Subject(
                name=subject_data["name"],
                slug=subject_data["slug"],
            )
            db.add(subject)
            db.flush()

        for topic_name in subject_data["topics"]:
            topic_slug = topic_name.lower().replace(" ", "-")

            existing_topic = db.query(Topic).filter(
                Topic.subject_id == subject.id,
                Topic.slug == topic_slug,
            ).first()

            if not existing_topic:
                db.add(
                    Topic(
                        subject_id=subject.id,
                        name=topic_name,
                        slug=topic_slug,
                    )
                )

    print("Subjects and topics seeded successfully!")


def seed_companies(db: Session):
    companies = [
        ("Google", "google"),
        ("Amazon", "amazon"),
        ("Microsoft", "microsoft"),
        ("Meta", "meta"),
        ("Adobe", "adobe"),
        ("Infosys", "infosys"),
        ("TCS", "tcs"),
        ("Accenture", "accenture"),
    ]

    for name, slug in companies:
        existing = db.query(Company).filter(
            Company.slug == slug
        ).first()

        if not existing:
            db.add(Company(name=name, slug=slug))

    print("Companies seeded successfully!")


def main():
    db = SessionLocal()

    try:
        seed_subjects(db)
        seed_companies(db)

        db.commit()

        print("Database seeding completed!")

    except Exception as error:
        db.rollback()
        print(f"Seeding failed: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()