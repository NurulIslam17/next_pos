<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    private const CUSTOMER_NAMES = <<<'TXT'
Walk-in Customer
Project Director
H.M Maruf
P.D PRANTIK SHOWROOM
SOMAJSHEBA ODIDOFTOR
Farzana Chobi
Dipak Biswas
Harunur Rashid Sir
somaj seba montrolai
Nazim Hossain
Afzal Hossain (P.D)
DG Sir (Dss)
Shakila sultana
Maksuda
Farabi
Mehedi hasan
Forhat hossain
Reza
Debabrata
Jahangir sir
Rakib
ovi
Alim
Md.Khalid
Nargis akter
Junayed
merena
Tahera jesmin
Tahura
Mr. muhit
salma sahid
hasan
julfikar
mhejabim
naher
sumi
Tipu Sultan
Asif
samina
maisha samiha
Sadia
sanjidai aysha
sagor
Maruf & keya
Jahangir alam
Imran hossain chowdhury
Lipi
Md. Eliyas
SIMRAN HOSSAIN
Partha
Saidul Islam
Sumi Haque
Tanvy
Kazi Mahtab Uddin
Munnaz Ety
Kamruzzaman
Shreya
Harunor roshad
Mahabub
Tanjil sir
Rihan
Nayan
Toboti
Saif Uddin
Arif
Arup sarkar
Uttam
NUPOR
Mahfuzur Rehman
somoy
sumi hok
jarin
Morsed
horon
Niloy
Mominul
Md. Junayed
Anas
Nasima Akter
Etu
Kazemul Islam
Rana
Adnan
Sheuli Akter
Rosy
Asha jahan
Rubina Akter
Shah poran
Fatema
Warde jannat
shohag
shoron
bivas biswis
Rasel
Md Tofajjal
Ahmed
sultan
Nasima
Gaffer
Humayon Kabir
jishan
Rifat
Atkiya
Nasrin
Arju ara
Shahidul Islam
Jaynal Abdin
Tabassum
Eng, Bishonath
Rafiul Hossain
Ontu akter
Jobayer Ahmed
Tofayel Ahmed
Shakil
Tamanna bhuyan
Shimu
Sazzad
Saleh Ahmed
Md. Tarek Mizan
Shahjahan
Mehrazj kabir
Sheuli
Iqbal
Dr.Zakir
Ettisha Chakma
Md. Alamin
Kashfiya
Taipa
Shirin Akter
Farzana yesmin
Shanta Akter
Most. Amena begum
Salmani
tasminsama
Ashik
Urmy khan
Md. Aminul Islam
Farida Akter
Nuru
Moneka
aishe
salha
moni
Sadman
Shamima Akter
Rakibul Hassan
Prity
Dr. Anwar
Moushumi
Salim
Md. Mizanur Rehman
Shahazadi chowdhuri
Munnaj Ety
Mojur
Masud
Nurunnahar Wily
Bristy
Projesh
Sheikh Masumul Hassan
Helal
munna
Anahita
Sabbir Ahmed
Sanjida
Arifa parvin
naim
rubana
shuddho
Mim Akter
Abu shaid
Amina khanom ferdowsi
Farjana yasmin
km abu rahan
Rakhi
abdul gafar
Robul islam
Prova
Nusrat
Hayat ali
Shanta
Khalid
Saiful Islam Pradhan
Mahir
Md. Mofizul Islam
mainunarhan
miraj
tapasultan
akshe
tuba
safin
kanizrahman
mizanur vi
balal
masud
riya
samta
Asma
Debdulal Majumder
Jahangir Alam
Lutful Amin Khan
Maruf
Anika
sanjida
Banoz
Mahbuba
Tasnuva
Fouad
Tahera
S.M Zillur rehman
Nipa
Maksuda Mila
Saif
Siam
Md. Nazmul Islam
Rashed
Hanif
Mamunur Rehman
Jamal Ahmed
dilruba
Humayun Kabir
Sakib Iqbal
Tajrimin Tabassum
Nurul Ialam
Ashraful Alam
Firoz Ahmed
Dip
Arafat Reyad
Shahin
Muslima
Md. Shadid
Sadiya
Ikramul
Mawya
Abid hassan
ZAhid
jabin
Halima khatun
Tani
Rakib hossain
Abu sayed
Habiba
Md. Kamruzzaman
Sabiba
Nishita Akter
sabiha
jesmin
kaji mahad
Riyad
Md Samsuzzaman
Nahiyan
Mukta Begum
Ruposree
Ritu
Mainul Kabir
Nasrin Rehman
Rina Akter
Shohan
Nazmul
ruoa
Roni Hossain
Sohel
Rajon
Md. sharif uddin
Awar
Rony
Amjad hosin
rakib
roky
sparrso
sOHON
Lizan
md kamal hossain
Parso
Nazmul hossain
Majba uadin
Salma
Raju
Hafsa
Jannatul nayeem
Md. Golam Rehman
Abul kalam Azad
Monira shikder
Salma Akter
Jesmin
Muskan Khan
Dr.Naznin
Rezaul Karim
Roksna
Mariya
Shahed
Hasib
Mofijul
Smriti
Prime
tithi
Masuma Rehman
Rupa
Tonni
Maruf it
Aman
Lija
Rajib
knka
Md sadat
Md miraj
SAdhin shorkar
Sima
SAsan ahmad
Abdul
Rumi
Rahat
Dawlatun nesa
Akhi
Ratika
MD.Akram Hossain
MOstofa kamal
JAhanigr
ASlam khan
SAiful
Preeti
Godhuly
ruma
sadiya
Rojnia
CAdas cumputer
Afif
Asma Begum
Mehraj
Mahin
Nahid Hassan
Aslam Mahmud
Mostaq
Sanjzida Ayesha
Kazi Md Fazlul Haque
Munira Bari
sankar
MAsuma roham
Ripon
MUKTA
Noushin
Rabby
FArid Ahmad
RAthin
Sushil
Imteaj Ahmed Mijan
Azad
Bojlur Rashid
Dr..Geeta
Mukta
Jashim
Jashim Uddin
Priti
Sakib
Fudues sara
Hasna Hena
Roni
SHaila
HArun
Tamanna jahan
Shudhir
Sm Shahjahan
Lamiya yesmin
Nurun Nahar
Nahar Sultana
Oshok Biswas
SAlauadun
Lovely Khanom
Imran
Abir
nayem
Zakir hossen
Mahbub Hassan
Sameda
Azhar
Shoma
Tajmoon
Rafiqul islam
Runa
Mahfuza Khaton
Nabid
M.A WAhid Murad
Sakib Newaz
tanjil sir
Maruf Mahdi Hasan
Md. Mahfuzur Rehman
Mamun
Lima
Hasan Iqbal
ruhul amin
NAjiya
Md.Milon Hosen
Dr.Arif
SAbbir hossain
SANbiya
SM Delwar Hossain
Mizan
AMReen
MOnir
Shahana
Azizur Rehman
Irene
Umme Kulsum
Tamanna Jahan
Samiha
Md. Rejalu Islam
Kaniz Fatema
Monsur
Sheuly
Shahanaz
Rebeka Sultana
Babu
Shokala
Anita Rani Kundu
Mukhlesur Rahman
Farhad Hossain
Md. Iqbal Hossain
Farhana Sharmin
Nozir Ahmed
Happy Akter
Atquer rahomah
Nurul Amin
khaled
Roushon Ara
S&T
Nazmul Kabir
Mohammad Ali
Monir Hossain
Mst. Amena Khatun
Md. Delwar Hossain
Kollol Saha
Md. Shajahan
Shamima Akter Rumi
Mainul Bashar
mim akter
Md. Mahmud
Haripada
Feroz
Zubayer
Ahahomod alli
rana
Saifur Rehman
Farhana
Sazzad Hossain
Khondokar Nurunnahar
Samsunnahar
Motiur Rehman
samia
Maruf Hashmi Biswas
Abdul Hamid
Md. Al Amin
Aslam
Azizul Islam
Md. Kafi
Tumpa chowdhury
Shaon
TXT;

    public function run(): void
    {
        $createdBy = User::query()->value('id');

        foreach (explode("\n", self::CUSTOMER_NAMES) as $name) {
            $name = trim($name);

            if ($name === '') {
                continue;
            }

            Customer::query()->updateOrCreate(['name' => $name], ['created_by' => $createdBy]);
        }
    }
}
